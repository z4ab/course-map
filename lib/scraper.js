const relationships = require("./relationships");
const jsdom = require("jsdom");

const urls = [
    ['CS', 'https://ucalendar.uwaterloo.ca/2324/COURSE/course-CS.html'],
    //['MATH', 'https://ucalendar.uwaterloo.ca/2324/COURSE/course-MATH.html'],
    //['STAT', 'https://ucalendar.uwaterloo.ca/2324/COURSE/course-STAT.html']
];

async function getCourseData() {
    let data = {
        relationships: relationships,
        courses: []
    };
    let promises = urls.map(e => fetch(e[1]).then(res => res.text()));
    return Promise.all(promises).then(responses => {
        responses.forEach((text, i) => {
            let subject = urls[i][0];
            data.courses.push(...parseCourses(text, subject));
        });
        return data;
    });
}

function parseCourses(site, subject) {
    let doc = new jsdom.JSDOM(site).window.document;
    let courseElements = doc.getElementsByClassName("divTable");
    let courseList = [...courseElements].reduce((result, e) => {
        return result.concat([{
            type: 'course',
            subject: subject,
            id: e.querySelector("a").name,
            title: e.children[2].textContent,
            description: e.children[3].textContent,
        }]);
    }, []);
    return courseList;
}

module.exports = {
    getCourseData
};
