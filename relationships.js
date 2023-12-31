var relationships = []
relationships.push(...[
    //{ type: 'prereq', from: 'CS115', to: 'CS116' },
    { type: 'prereq', from: 'CS135', to: 'CS136' },

    //{ type: 'prereq', from: 'CS116', to: 'CS230' },
    //{ type: 'prereq', from: 'CS116', to: 'CS231' },
    //{ type: 'prereq', from: 'CS116', to: 'CS234' },

    { type: 'prereq', from: 'CS136', to: 'CS246' },
    { type: 'prereq', from: 'CS136', to: 'CS245' },
    { type: 'prereq', from: 'CS136', to: 'CS251' },

    { type: 'prereq', from: 'CS245', to: 'CS240' },
    { type: 'prereq', from: 'CS246', to: 'CS241' },
    { type: 'prereq', from: 'CS246', to: 'CS350' },
    { type: 'prereq', from: 'CS246', to: 'CS346' },

    { type: 'prereq', from: 'CS251', to: 'CS350' },
    //{ type: 'prereq', from: 'CS251', to: 'CS431' },
    //{ type: 'prereq', from: 'CS251', to: 'CS436' },

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

    { type: 'prereq', from: 'CS360', to: 'CS462' },
    { type: 'prereq', from: 'CS365', to: 'CS462' },

    { type: 'prereq', from: 'CS350', to: 'CS343' },
    { type: 'prereq', from: 'CS246', to: 'CS346' },
    { type: 'prereq', from: 'CS240', to: 'CS348' },
    { type: 'prereq', from: 'MATH136', to: 'CS349' },
    { type: 'prereq', from: 'CS241', to: 'CS349' },
    { type: 'prereq', from: 'CS350', to: 'CS444' },
    { type: 'prereq', from: 'CS350', to: 'CS445' },
    { type: 'prereq', from: 'CS350', to: 'CS446' },
    { type: 'prereq', from: 'CS350', to: 'CS447' },
    { type: 'prereq', from: 'CS348', to: 'CS448' },
    { type: 'prereq', from: 'CS350', to: 'CS448' },
    { type: 'prereq', from: 'CS245', to: 'CS450' },
    { type: 'prereq', from: 'CS350', to: 'CS450' },
    { type: 'prereq', from: 'CS341', to: 'CS451' },
    { type: 'prereq', from: 'CS348', to: 'CS451' },
    { type: 'prereq', from: 'CS350', to: 'CS451' },
    { type: 'prereq', from: 'CS350', to: 'CS452' },
    { type: 'prereq', from: 'CS350', to: 'CS454' },
    { type: 'prereq', from: 'CS350', to: 'CS456' },
    { type: 'prereq', from: 'CS246', to: 'CS457' },
    { type: 'prereq', from: 'STAT231', to: 'CS457' },
    { type: 'prereq', from: 'CS350', to: 'CS458' },
    { type: 'prereq', from: 'CS341', to: 'CS466' },
    { type: 'prereq', from: 'CS341', to: 'CS480' },
    { type: 'prereq', from: 'STAT231', to: 'CS480' },
    { type: 'prereq', from: 'CS341', to: 'CS482' },
    { type: 'prereq', from: 'STAT231', to: 'CS482' },

    { type: 'prereq', from: 'STAT230', to: 'CS240' },
    { type: 'prereq', from: 'CS241', to: 'CS240' },

    { type: 'prereq', from: 'MATH135', to: 'CS245' },
    { type: 'prereq', from: 'MATH135', to: 'MATH136' },
    { type: 'prereq', from: 'MATH137', to: 'MATH138' },

    { type: 'prereq', from: 'MATH138', to: 'STAT230' },
    { type: 'prereq', from: 'STAT230', to: 'STAT231' },
])