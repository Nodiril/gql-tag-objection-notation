module.exports = function getObjectNotation(obj) {
    return buildObjectionNotation(obj);
};

function buildObjectionNotation(obj) {
    var _out = new obj.constructor;

    if ((typeof obj === 'object') && (obj !== null) && obj.selectionSet && obj.selectionSet.selections) {

        if (obj.selectionSet.selections.some((el) => { if (el.selectionSet) return true; })) {
            _out = createModifyForBranch(obj)

            obj.selectionSet.selections.forEach((el) => {
                if (el.selectionSet && el.selectionSet.selections) {
                    _out[el.name.value] = buildObjectionNotation(el);
                }
            })
        }
        else {
            _out = createModifyForLeaf(obj)
        }
    }
    return _out;
}

function createModifyForBranch(obj) {
    let result = obj.selectionSet.selections.filter(el => el.selectionSet === undefined).map(a => a.name.value);
    return createModify(result)
}

function createModifyForLeaf(obj) {
    let result = obj.selectionSet.selections.map(a => a.name.value);
    return createModify(result)
}

function createModify(fields) {
    return {
        $modify: (builder) => { builder.select(fields.map(a => builder._modelClass.tableName.concat('.', a))) }
    }
}