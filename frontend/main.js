var courses = []
var relationships = []

const graph = provider({
    parentType: 'child',
    sourceRef: 'to',
    targetRef: 'from',
})

fetch('http://127.0.0.1:3000/coursedata', {
    method: "GET",
    mode: "cors"
})
    .then((response) => response.json())
    .then((obj) => {
        relationships.push(...obj.relationships)
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
        hierarchy: ['course'],                         // required!
        currentLevelEntity: null,
        entityLabelKey: 'id',                    // required!
        nodeLabelKey: 'id',
        relationship: {
            parentType: 'child',                      // required!
            sourceRef: 'to',                       // required!
            targetRef: 'from',                       // required!
        },
        width: '100%',
        height: 900,
        colorScheme: 'dark',                  // 'light' or 'dark',
        onMouseOverDirection: 'outgoing',
        limitToSameParentInTree: false,
        onMouseOverFinish: function (entity) { },
        onMouseOutFinish: function (entity) { },
        onClickFinish: function (entity) { },
    }
    var widget = xoces.widgets.TreeWidget.new(config)

    widget.render({
        container: 'xocesContainer'
    });
    // Add click event for each course node
    [...document.getElementsByClassName("TREE_VIEW__NODE_CLASS")].forEach(e => {
        e.onclick = nodeClicked
    })
    document.getElementById('search').oninput = searchUpdated
    document.getElementById('search').onkeypress = searchKeyPress
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

var topresult;
function searchUpdated() {
    let searchText = document.getElementById('search').value.toUpperCase()
    let results = courses.reduce((result, c) => {
        if (c.id.search(searchText) != -1) result.push(c.id)
        return result
    }, [])
    topresult = results[0]
}
function selectCourse(sel) {
    if (!sel) return;
    // Get all courses leading up to top result
    let outID = [sel, ...getOutgoingEntitiesAll(sel, courses, relationships).map(e=>e.id)]

    let nodes = [...document.getElementsByClassName("TREE_VIEW__NODE_CLASS")]
    nodes.filter(e=> {
        return !outID.includes(e.children[0].textContent)
    }).forEach(e=>{
        e.setAttribute("style","opacity:0.25;")
    })
    nodes.filter(e=> {
        return outID.includes(e.children[0].textContent)
    }).forEach(e=>{
        e.setAttribute("style","opacity:1;")
    })
    updateInfo(courses.find(c=>c.id===topresult))
}
function searchKeyPress(e) {
    if (e.key === "Enter")
    {
        selectCourse(topresult)
    }
}