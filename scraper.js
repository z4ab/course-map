const jsdom = require("jsdom");
const fs = require('node:fs');

var data = {
    relationships: [],
    courses: []
}

// Add cs courses
data.relationships = data.relationships.concat([
    { type: 'prereq', from: 'CS115', to: 'CS116' },
    { type: 'prereq', from: 'CS135', to: 'CS136' },

    { type: 'prereq', from: 'CS116', to: 'CS230' },
    { type: 'prereq', from: 'CS116', to: 'CS231' },
    { type: 'prereq', from: 'CS116', to: 'CS234' },

    { type: 'prereq', from: 'CS136', to: 'CS246' },
    { type: 'prereq', from: 'CS136', to: 'CS245' },
    { type: 'prereq', from: 'CS136', to: 'CS251' },

    { type: 'prereq', from: 'CS245', to: 'CS240' },
    { type: 'prereq', from: 'CS246', to: 'CS241' },
    { type: 'prereq', from: 'CS246', to: 'CS350' },
    { type: 'prereq', from: 'CS246', to: 'CS346' },

    { type: 'prereq', from: 'CS251', to: 'CS350' },
    { type: 'prereq', from: 'CS251', to: 'CS431' },
    { type: 'prereq', from: 'CS251', to: 'CS436' },

    { type: 'prereq', from: 'CS240', to: 'CS341' },
    { type: 'prereq', from: 'CS240', to: 'CS350' },
    { type: 'prereq', from: 'CS240', to: 'CS360' },
    { type: 'prereq', from: 'CS240', to: 'CS365' },
    { type: 'prereq', from: 'CS240', to: 'CS442' },
    { type: 'prereq', from: 'CS240', to: 'CS449' },

    { type: 'prereq', from: 'CS241', to: 'CS350' },
    { type: 'prereq', from: 'CS241', to: 'CS360' },
    { type: 'prereq', from: 'CS241', to: 'CS365' },
    { type: 'prereq', from: 'CS241', to: 'CS449' },

    { type: 'prereq', from: 'CS365', to: 'CS462' },
])

// Add ece courses
data.relationships = data.relationships.concat([
    { type: 'prereq', from: 'ECE150', to: 'ECE155' },
    { type: 'prereq', from: 'MATH135', to: 'CS245' },
])

// Add math courses
data.relationships = data.relationships.concat([
    { type: 'prereq', from: 'MATH135', to: 'MATH136' },
    { type: 'prereq', from: 'MATH137', to: 'MATH138' },
])

function toObject(site, subject) {
    const doc = new jsdom.JSDOM(site).window.document;
    const courseElements = doc.getElementsByClassName("divTable");
    const courseList = [...courseElements].reduce((result, e) => {
        return result.concat([{
            type: 'course',
            subject: subject,
            id: e.querySelector("a").name,
            title: e.children[2].textContent,
            description: e.children[3].textContent,
        }])
    }, []);
    data.courses.push(...courseList);
}
function writeFile() {
    let content = JSON.stringify(data);
    fs.writeFile(`./data.json`, content, err => {
        if (err) {
            console.error(err);
        }
    });
}

function addParents() {
    data.courses.forEach((course, i) => {
        //let fromList = data.relationships.map(e=>e.from);
        //let toList = data.relationships.map(e=>e.to);
        //if (fromList.includes(course.id) || toList.includes(course.id)) {
        data.relationships.push({
            //id: `c${i+1}`, 
            type: 'child',
            from: course.subject,
            to: course.id
        })
    })
}

const urls = [
    ['CS', 'https://ucalendar.uwaterloo.ca/2324/COURSE/course-CS.html'],
    ['ECE', 'https://ucalendar.uwaterloo.ca/2324/COURSE/course-ECE.html'],
    ['MATH', 'https://ucalendar.uwaterloo.ca/2324/COURSE/course-MATH.html']
]
var promises = urls.map(e => fetch(e[1]).then(res => res.text()))

Promise.all(promises).then(responses => {
    responses.forEach((text, i) => {
        let subject = urls[i][0]
        toObject(text, subject);
        addParents();
    })
    writeFile();
})