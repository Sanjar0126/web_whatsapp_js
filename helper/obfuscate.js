/**
 * Obfuscates text by randomly replacing Latin characters with similar Cyrillic ones and vice versa.
 * @param {string} text - The input text to obfuscate.
 * @returns {string} - The obfuscated text.
 */
export function obfuscateText(text) {
    const latinToCyrillic = {
        'A': 'А', 'B': 'В', 'E': 'Е', 'K': 'К', 'M': 'М', 'H': 'Н', 'O': 'О', 'P': 'Р', 'C': 'С', 'T': 'Т', 'X': 'Х', 'Y': 'У',
        'a': 'а', 'e': 'е', 'o': 'о', 'p': 'р', 'c': 'с', 'x': 'х', 'y': 'у'
    };

    const cyrillicToLatin = {
        'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'У': 'Y',
        'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y'
    };

    return text.split('').map(char => {
        // 50% chance to attempt replacement
        if (Math.random() < 0.5) {
            if (latinToCyrillic[char]) {
                return latinToCyrillic[char];
            } else if (cyrillicToLatin[char]) {
                return cyrillicToLatin[char];
            }
        }
        return char;
    }).join('');
}
