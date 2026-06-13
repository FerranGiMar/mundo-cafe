const crypto = require('crypto');

const HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function isHashedPassword(value) {
    return typeof value === 'string' && value.startsWith(`${HASH_PREFIX}$`);
}

function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const normalizedPassword = String(password || '');
        const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');

        crypto.scrypt(normalizedPassword, salt, KEY_LENGTH, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(`${HASH_PREFIX}$${salt}$${derivedKey.toString('hex')}`);
        });
    });
}

function verifyPassword(password, hashedPassword) {
    return new Promise((resolve, reject) => {
        const normalizedPassword = String(password || '');

        if (!isHashedPassword(hashedPassword)) {
            resolve(normalizedPassword === String(hashedPassword || ''));
            return;
        }

        const [, salt, storedKey] = hashedPassword.split('$');

        crypto.scrypt(normalizedPassword, salt, KEY_LENGTH, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            const storedBuffer = Buffer.from(storedKey, 'hex');
            const derivedBuffer = Buffer.from(derivedKey);

            if (storedBuffer.length !== derivedBuffer.length) {
                resolve(false);
                return;
            }

            resolve(crypto.timingSafeEqual(storedBuffer, derivedBuffer));
        });
    });
}

module.exports = {
    hashPassword,
    isHashedPassword,
    verifyPassword
};
