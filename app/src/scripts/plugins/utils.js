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
    var authorInfo;
    if (pDbEntry.value.volumeInfo.authors) {
        authorInfo = '';
        var authorCount = pDbEntry.value.volumeInfo.authors.length;
        for (var itemIndex in pDbEntry.value.volumeInfo.authors) {
            authorInfo += pDbEntry.value.volumeInfo.authors[itemIndex];
            if (itemIndex < authorCount - 1) {
                authorInfo += ', ';
            }
        }
    }
    if (pDbEntry.value.volumeInfo.publishedDate) {
        var parsedDate = parseDate(pDbEntry.value.volumeInfo.publishedDate);
        pDbEntry.value.volumeInfo.publishedDate = parsedDate;
    }
    pDbEntry.authorInfo = authorInfo;
    return pDbEntry;
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
            var itemInfo = pDbEntries[itemIndex];
            if (itemInfo.value && itemInfo.value.volumeInfo) {
                var isbn = itemInfo.value.volumeInfo.industryIdentifiers[0].identifier;
                if (bookEntries[isbn]) {

                    bookEntries[isbn].count += 1;
                    bookEntries[isbn].docs.push(itemInfo);
                } else {
                    bookEntries[isbn] = {};
                    bookEntries[isbn].value = itemInfo.value;
                    bookEntries[isbn].image = itemInfo.image;
                    bookEntries[isbn].count = 1;
                    bookEntries[isbn].docs = [];
                    bookEntries[isbn].docs.push(itemInfo);
                    bookEntries[isbn] = enrichSingleDbEntry(bookEntries[isbn]);
                    //expose id
                    bookEntries[isbn]._id = itemInfo._id;
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