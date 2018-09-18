const R = require('ramda')
const defaultIsPlaceholder = R.anyPass([
  x => typeof x !== 'object',
  R.isNil
])
const getPlaceholdersWithPaths = (obj, isPlaceholder = defaultIsPlaceholder) => {
  const _getPlaceholdersWithPaths = (obj, objHistory) => {
    switch (true) {
      case objHistory.includes(obj):
        return []
      case isPlaceholder(obj):
        return [{
          path: [],
          placeholder: obj
        }]
      case typeof obj !== 'object':
        return []
      default:
        const entryToPlaceholdersArr = ([propName, value]) => {
          const subPathPlaceholders = _getPlaceholdersWithPaths(
            value,
            [...objHistory, obj]
          )
          return subPathPlaceholders.map(({
            path,
            placeholder
          }) => ({
            path: [propName, ...path],
            placeholder
          }))
        }
        const placeholdersWithPathArrs = Object.entries(obj)
          .map(entryToPlaceholdersArr)
        return R.flatten(placeholdersWithPathArrs)
    }
  }

  const res = _getPlaceholdersWithPaths(obj, [])
  return res
}

const getValuesByStructure = R.curry((structure, obj) => {
  const numberPlaceholderToObj = (({
    path: p,
    placeholder
  }) => {
    const value = R.path(p, obj)
    const res = []
    res[placeholder] = value
    return res
  })
  const stringPlaceholderToObj = (({
    path: p,
    placeholder
  }) => {
    const value = R.path(p, obj)
    return R.objOf(placeholder, value)
  })
  const functionPlaceholderToObj = (({
    path: p,
    placeholder
  }) => {
    const value = R.path(p, obj)
    const resObj = placeholder(value, p, obj)
    const lastPathName = R.pathOr('', [p.length - 1], p)
    return typeof resObj === 'object' ?
      resObj :
      R.objOf(lastPathName, resObj)
  })
  const placeholders = getPlaceholdersWithPaths(structure)
  const resObjects = placeholders.map((placeholderWithPath) => {
    switch (typeof placeholderWithPath.placeholder) {
      case 'function':
        return functionPlaceholderToObj(placeholderWithPath)
      case 'string':
        return stringPlaceholderToObj(placeholderWithPath)
      case 'number':
        return numberPlaceholderToObj(placeholderWithPath)
      default:
        return {}
    }
  })
  const initialValue = resObjects.some(Array.isArray) ? [] : {}
  const res = resObjects.reduce((resObjOrArr, obj) => {
    R.forEachObjIndexed((value, propName) => {
      resObjOrArr[propName] = value
    }, obj)
    return resObjOrArr
  }, initialValue)
  return res
})

const pipeValuesByStructure = R.curry((inStructure, outStructure, obj) => {
  const setByPath = (path, value, obj) => {
    if (R.isEmpty(path)) return value
    const lastObj = path.slice(0, -1).reduce((last, propName) => last[propName] || {}, obj)
    const lastProp = R.last(path)
    lastObj[lastProp] = value
    return obj
  }
  const input = getValuesByStructure(inStructure, obj)
  const pathsWithPlaceholders = getPlaceholdersWithPaths(outStructure)
  const functionPlaceholderToObj = ({
    path: p,
    placeholder
  }, resObj) => {
    const value = placeholder(input, obj)
    return setByPath(p, value, resObj)
  }
  const propValuePlaceholderToObj = ({
    path: p,
    placeholder
  }, resObj) => {
    const value = input[placeholder]
    return setByPath(p, value, resObj)
  }
  const res = pathsWithPlaceholders.reduce((resObj, placeholderWithPath) => {
    switch (typeof placeholderWithPath.placeholder) {
      case 'function':
        return functionPlaceholderToObj(placeholderWithPath, resObj)
      case 'number':
      case 'string':
        return propValuePlaceholderToObj(placeholderWithPath, resObj)
      default:
        return resObj
    }
  }, R.clone(outStructure))
  return res
})

const named = R.curry((f, propName) => function (...args) {
  return {
    [propName]: f.apply(this, args)
  }
})

module.exports = {
  getPlaceholdersWithPaths,
  getValuesByStructure,
  pipeValuesByStructure,
  named
}