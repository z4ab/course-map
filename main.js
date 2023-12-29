var courses = [
    { id: 'CS', type: 'subject', name: 'CS' },
    { id: 'ECE', type: 'subject', name: 'ECE'},
    { id: 'MATH', type: 'subject', name: 'MATH'},
    { id: 'MATH69', type: 'course', name: 'MATH69'}
]
var relationships = [{type: 'prereq', from: 'MATH69', to: 'MATH135'}]

fetch('./data.json')
    .then((response) => response.json())
    .then((obj) => {
        courses = courses.concat(obj.subjects.CS)
        relationships = obj.relationships
        createMap()
    })
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

    var widget = xoces.widgets.XocesWidget.new(config)

    widget.render({
        container: 'xocesContainer'
    })
}