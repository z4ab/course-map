const jsdom = require("jsdom");
const fs = require('node:fs');

var data = {
    relationships: [],
    courses: []
}

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
    ['MATH', 'https://ucalendar.uwaterloo.ca/2324/COURSE/course-MATH.html'],
    ['STAT', 'https://ucalendar.uwaterloo.ca/2324/COURSE/course-STAT.html']
]
function getCourseData() {
    var promises = urls.map(e => fetch(e[1]).then(res => res.text()))
    Promise.all(promises).then(responses => {
        responses.forEach((text, i) => {
            let subject = urls[i][0]
            toObject(text, subject);
        })
        writeFile();
    })
}
getCourseData();