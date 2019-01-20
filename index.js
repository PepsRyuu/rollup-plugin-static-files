let fs = require('fs-extra');
let path = require('path');
let klawSync = require('klaw-sync');
let cheerio = require('cheerio');

function findMatchingFile (pattern, bundle) {
    for (let file in bundle) {
        if (pattern.test(file)) {
            return file;
        }
    }
}

module.exports = function (options) {
    return {
        generateBundle (outputOptions, bundle) {
            let target_directory = outputOptions.dir || path.dirname(outputOptions.file);

            (options.include || []).forEach(directory => {
                fs.copySync(directory, target_directory);

                let htmlFiles = klawSync(target_directory, { 
                    filter: file => file.path.endsWith('.html') 
                });

                htmlFiles.forEach(file => {
                    let content = fs.readFileSync(file.path, 'utf8');
                    let $ = cheerio.load(content);
                    $('script, link').each(function (i, el) {
                        el = $(this);
                        ['src', 'href'].forEach(attr => {
                            let value = el.attr(attr);
                            if (value) {
                                let pattern = new RegExp(`^${value.replace('[hash]', '([a-f0-9]+)').substring(1)}$`);
                                let file = findMatchingFile(pattern, bundle);
                                if (file) {
                                    el.attr(attr, '/' + file);
                                }
                            }
                        });
                    });

                    fs.writeFileSync(file.path, $.html());
                });

            });            
        }
    }
}