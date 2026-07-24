const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');

// Storage abstraction (D9): local disk (dev) or S3-compatible (prod).
// Default local root: trialvo-shop/uploads (package root), not buried under backend/.
const DRIVER = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
const PUBLIC_BASE = (process.env.STORAGE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
const LOCAL_ROOT = process.env.UPLOAD_DIR
  || path.join(__dirname, '..', '..', '..', 'uploads');

let s3Client = null;

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function randomName(ext) {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

function getS3Config() {
    return {
        region: process.env.S3_REGION || process.env.AWS_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === '1' || Boolean(process.env.S3_ENDPOINT),
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
        },
        bucket: process.env.S3_BUCKET || '',
        publicBase: process.env.S3_PUBLIC_URL || process.env.STORAGE_URL || '',
    };
}

async function getS3() {
    if (s3Client) return s3Client;
    // Lazy require so local-only installs need no AWS SDK until S3 is selected
    let S3Client;
    let PutObjectCommand;
    let DeleteObjectCommand;
    let GetObjectCommand;
    try {
        ({ S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3'));
    } catch {
        throw new Error(
            'STORAGE_DRIVER=s3 requires @aws-sdk/client-s3. Run: npm i @aws-sdk/client-s3'
        );
    }
    const cfg = getS3Config();
    if (!cfg.bucket || !cfg.credentials.accessKeyId) {
        throw new Error('S3_BUCKET and S3_ACCESS_KEY (or AWS_*) are required for S3 driver');
    }
    s3Client = {
        client: new S3Client({
            region: cfg.region,
            endpoint: cfg.endpoint,
            forcePathStyle: cfg.forcePathStyle,
            credentials: cfg.credentials,
        }),
        bucket: cfg.bucket,
        publicBase: (cfg.publicBase || '').replace(/\/$/, ''),
        PutObjectCommand,
        DeleteObjectCommand,
        GetObjectCommand,
    };
    return s3Client;
}

async function saveBuffer(buffer, { ext = '.webp', subdir = 'media' } = {}) {
    const filename = randomName(ext);
    const storageKey = path.posix.join(subdir, filename);

    if (DRIVER === 'local') {
        const absDir = path.join(LOCAL_ROOT, subdir);
        ensureDir(absDir);
        fs.writeFileSync(path.join(absDir, filename), buffer);
        // Relative /uploads/... so shop (any port) + API can resolve via mediaUrl helper.
        // Absolute PUBLIC_BASE URL kept for clients that need a full link (emails, etc.).
        const relativeUrl = `/uploads/${storageKey}`;
        return {
            storageKey,
            url: relativeUrl,
            absoluteUrl: `${PUBLIC_BASE}${relativeUrl}`,
        };
    }

    if (DRIVER === 's3' || DRIVER === 'gcs' || DRIVER === 'minio') {
        const s3 = await getS3();
        await s3.client.send(new s3.PutObjectCommand({
            Bucket: s3.bucket,
            Key: storageKey,
            Body: buffer,
            ContentType: ext === '.webp' ? 'image/webp'
                : ext === '.enc' ? 'application/octet-stream'
                    : 'application/octet-stream',
        }));
        const url = s3.publicBase
            ? `${s3.publicBase}/${storageKey}`
            : `s3://${s3.bucket}/${storageKey}`;
        return { storageKey, url };
    }

    throw new Error(`Storage driver "${DRIVER}" is not implemented`);
}

async function deleteKey(storageKey) {
    if (!storageKey) return;
    if (DRIVER === 'local') {
        const abs = path.join(LOCAL_ROOT, storageKey);
        if (fs.existsSync(abs)) {
            try { fs.unlinkSync(abs); } catch { /* best-effort */ }
        }
        return;
    }
    if (DRIVER === 's3' || DRIVER === 'gcs' || DRIVER === 'minio') {
        const s3 = await getS3();
        await s3.client.send(new s3.DeleteObjectCommand({ Bucket: s3.bucket, Key: storageKey }));
        return;
    }
    throw new Error(`Storage driver "${DRIVER}" is not implemented`);
}

function absolutePath(storageKey) {
    if (DRIVER !== 'local') {
        throw new Error(`absolutePath only supported for local driver (got ${DRIVER})`);
    }
    return path.join(LOCAL_ROOT, storageKey);
}

function openReadStream(storageKey) {
    if (DRIVER === 'local') {
        const abs = absolutePath(storageKey);
        if (!fs.existsSync(abs)) throw new Error('Storage object not found');
        return fs.createReadStream(abs);
    }
    // Async S3 stream: return a placeholder promise-based helper via getObjectStream
    throw new Error('Use openReadStreamAsync for non-local drivers');
}

async function openReadStreamAsync(storageKey) {
    if (DRIVER === 'local') return openReadStream(storageKey);
    if (DRIVER === 's3' || DRIVER === 'gcs' || DRIVER === 'minio') {
        const s3 = await getS3();
        const out = await s3.client.send(new s3.GetObjectCommand({
            Bucket: s3.bucket,
            Key: storageKey,
        }));
        if (out.Body instanceof Readable) return out.Body;
        // Node SDK v3 Body is a readable stream in Node
        return Readable.fromWeb ? Readable.fromWeb(out.Body) : out.Body;
    }
    throw new Error(`Storage driver "${DRIVER}" is not implemented`);
}

module.exports = {
    DRIVER,
    LOCAL_ROOT,
    PUBLIC_BASE,
    saveBuffer,
    deleteKey,
    absolutePath,
    openReadStream,
    openReadStreamAsync,
};
