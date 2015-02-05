/**
 * @ngdoc function
 * @name parseDate
 * @function
 * @param {string} pDate - date to be parsed
 *
 * @description
 * Parses a given string to a date object, e.g. 2000-01 and 2011-11-01 or 2005.
 * Returns a date object or null if string size is less 4.
 */
function parseDate(pDate) {
    var date;
    if (typeof pDate === 'date') {
        return pDate;
    } else {
        if (pDate && pDate.length >= 4) {
            date = new Date();
            if (pDate.length == 4) {
                date.setFullYear(pDate);
                date.setMonth(0);
                date.setDate(1);
            } else {
                // 2000-01
                if (pDate.length == 7) {
                    var inputDate = pDate.split("-", 2);
                    date.setFullYear(inputDate[0]);
                    date.setMonth(inputDate[1]);
                    date.setDate(1);
                } else {
                    // 2000-01-01
                    if (pDate.length == 10) {
                        var inputDate = pDate.split("-", 3);
                        date.setFullYear(inputDate[0]);
                        date.setMonth(inputDate[1]);
                        date.setDate(inputDate[2]);
                    } else {
                        date = new Date(pDate);
                    }
                }
            }
        }
    }
    return date;
}


String.prototype.hashCode = function() {
    var hash = 0,
        i, chr, len;
    if (this.length == 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};


/**
 * @ngdoc function
 * @name enrichSingleDbEntry
 * @function
 * @param {object} pDbEntry - db entry to parse
 *
 * @description
 * Parses a database entry and enrichs for UI
 */
function enrichSingleDbEntry(pDbEntry) {
    var result = {},
        authorInfo,
        isbnInfo;
    result.value = pDbEntry.value;
    result.image = pDbEntry.image;
    // TODO_#65
    // move to service
    // Author info
    if (pDbEntry.value.volumeInfo.authors) {
        authorInfo = '';
        var authorCount = pDbEntry.value.volumeInfo.authors.length;
        for (var itemIndex in pDbEntry.value.volumeInfo.authors) {
            authorInfo += pDbEntry.value.volumeInfo.authors[itemIndex];
            if (itemIndex < authorCount - 1) {
                authorInfo += ',';
            }
        }
        result.authorInfo = authorInfo;
    }
    if (pDbEntry.value.volumeInfo.publishedDate) {
        var parsedDate = parseDate(pDbEntry.value.volumeInfo.publishedDate);
        result.value.volumeInfo.publishedDate = parsedDate;
    }

    // TODO_#65
    // move to service
    if (pDbEntry.value.volumeInfo.industryIdentifiers) {
        isbnInfo = '';
        var isbnCount = pDbEntry.value.volumeInfo.industryIdentifiers.length;
        for (var itemIndex in pDbEntry.value.volumeInfo.industryIdentifiers) {
            isbnInfo += pDbEntry.value.volumeInfo.industryIdentifiers[itemIndex].identifier;
            if (itemIndex < isbnCount - 1) {
                isbnInfo += ',';
            }
        }
        result.isbnInfo = isbnInfo;
    }

    return result;
}

/**
 * @ngdoc function
 * @name enrichDbData
 * @function
 * @param {object} pDbEntries - db entries to parse
 *
 * @description
 * Reduces multiple db entries to set without duplicates. This method also counts the records
 * to get the amount of book entries
 */
function enrichDbData(pDbEntries) {
    var result = false,
        bookEntries = {},
        resultsFound = false;
    if (pDbEntries) {
        for (var itemIndex in pDbEntries) {
            var itemInfo = enrichSingleDbEntry(pDbEntries[itemIndex]);
            if (itemInfo.value && itemInfo.value.volumeInfo) {
                var id = itemInfo.value.id;
                if (bookEntries[id]) {
                    bookEntries[id].count++;
                    bookEntries[id].docs.push(itemInfo);
                } else {
                    bookEntries[id] = itemInfo;
                    bookEntries[id].count = 1;
                    bookEntries[id].docs = [];
                    bookEntries[id].docs.push(itemInfo);
                    resultsFound = true;
                }
            }
        }
        if (resultsFound) {
            // transfer to array
            result = [];
            for (var isbn in bookEntries) {
                result.push(bookEntries[isbn]);
            }
        }
    }
    return result;
};