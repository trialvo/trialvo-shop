const bcrypt = require('bcrypt')

const pass="12345678";

// const hashPassword = async () => {
//   const hashedPassword = await bcrypt.hash(pass, 10);
//   console.log(hashedPassword);
// }

// hashPassword();

const isPasswordValid = async (password, hashedPassword) => {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
}

const hashedPassword = '$2b$10$NiSZwR1ihmUEs7tv2ElyKuyDebRWAhIzNT4fYRU2ghRKyVuKA.4fe'

isPasswordValid(pass, hashedPassword).then(match => {
    console.log("Password match:", match);
}).catch(err => {
    console.error("Error comparing passwords:", err);
});