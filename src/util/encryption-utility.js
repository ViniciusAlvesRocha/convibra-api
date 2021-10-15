module.exports = {
    encryptPassword: function (salt, value) {
        let encryptedValue = crypto.createHmac('sha1', salt).update(value).digest('hex')
        return encryptedValue
    },
    isPasswordMatch: function (encryptedString, rawString, salt) {
        let result = false;
        let encryptedValue = crypto.createHmac('sha1', salt).update(rawString).digest('hex')
        if (encryptedString == encryptedValue) {
            result = true;
        }
        return result;
    },
    encryptText: function (key, text) {
        let cipher = crypto.createCipher('aes256', key);
        let encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
        return encrypted;
    },
    decryptEncryptedText: function (key, text) {
        let decipher = crypto.createDecipher('aes256', key);
        let decrypted = decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
        return decrypted;
    },
    generateSignature:function(key,text){
        let cipher = crypto.createCipher('aes128', key);
        let encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
        return encrypted;
    },
    decryptSignature:function(key,text){
        let decipher = crypto.createDecipher('aes128', key);
        let decrypted = decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
        return decrypted;
    }
}