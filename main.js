var courses = [
    { id: 'CS', type: 'subject', name: 'CS' },
    { id: 'MATH', type: 'subject', name: 'MATH' },
]
var relationships = []

fetch('./data.json')
    .then((response) => response.json())
    .then((obj) => {
        relationships = obj.relationships
        addCourses(obj)
        createMap()
    })
function addCourses(obj) {
    let loaded = obj.courses
    let supported = []
    relationships.forEach(r => {
        if (r.type === 'prereq') {
            if (!supported.includes(r.from)) supported.push(r.from)
            if (!supported.includes(r.to)) supported.push(r.to)
        }
    })
    console.log(supported)
    loaded.forEach(e => {
        if (supported.includes(e.id)) courses.push(e)
    });
}
function createMap() {

    var config = {
        data: {
            entities: courses,                  // required!
            relationships: relationships
        },
        hierarchy: ['subject', 'course'],                         // required!
        currentLevelEntity: null,
        entityLabelKey: 'id',                    // required!
        nodeLabelKey: 'id',
        relationship: {
            parentType: 'child',                      // required!
            sourceRef: 'to',                       // required!
            targetRef: 'from',                       // required!
        },
        width: '100%',
        height: 700,
        colorScheme: 'dark',                  // 'light' or 'dark',
        onMouseOverDirection: 'outgoing',
        limitToSameParentInTree: false,
        onMouseOverFinish: function (entity) { },
        onMouseOutFinish: function (entity) { },
        onClickFinish: function (entity) { }
    }

    var widget = xoces.widgets.TreeWidget.new(config)

    widget.render({
        container: 'xocesContainer'
    });
    // Add click event for each course node
    [...document.getElementsByClassName("TREE_VIEW__NODE_CLASS")].forEach(e => {
        e.onclick = nodeClicked
    })
}

function nodeClicked(e) {
    var code = e.target.textContent
    let course = courses.find(c => c.id == code)
    updateInfo(course)
}

function updateInfo(course) {
    let panel = document.getElementById('infoPanel')
    let link = panel.querySelector('a')
    link.innerText = course.id + " - " + course.title
    link.href = `https://ucalendar.uwaterloo.ca/2324/COURSE/course-${course.subject}.html#${course.id}`
    link.target = '_blank'
    panel.querySelector('p').innerText = course.description
}
}