use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2, Params, Version,
};

fn main() {
    let password = std::env::args().nth(1).unwrap_or_else(|| {
        eprintln!("Usage: hash_password <password>");
        std::process::exit(1);
    });

    let salt = SaltString::generate(&mut OsRng);
    let params = Params::new(65536, 3, 4, None).expect("Invalid params");
    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, Version::V0x13, params);

    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .expect("Hashing failed")
        .to_string();

    println!("{}", hash);
}
