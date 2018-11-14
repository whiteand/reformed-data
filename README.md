# reformed-data

[![Greenkeeper badge](https://badges.greenkeeper.io/whiteand/reformed-data.svg)](https://greenkeeper.io/)

npm package with functions that can be used for declarative data transformations

# Goal

Goal is to create some functions for easy data structure changing

# Result

The result is an `reformed-data` npm package

# Examples

```javascript

// get functions from package
const { getValuesByStructure, pipeValuesByStructure } = require('reformed-data')

// GET_VALUES_BY_STRUCTURE EXAMPLES
// getValuesByStructure has two parameters:
// 1) inputStructure - object with placeholders inside. Placeholders are used to mark place of value
// 2) object - object with data
// 
// It returns object or an array with keys and values described by placeholders
// 
// There are three types of placeholders:
// 1) String placeholder
//   String placeholder is used as a key. Corresponding value is used as a value of the key.
// 2) Number placeholder
//   Number placeholder is similar to string placeholder. But there is difference:
//   - if there is only one number placeholder result will be an array.
// 3) Function placeholder
//   Function placeholder is used to calculate set of values based on the placeholdered value.
//   function placeholder has three params:
//   @param {*} value placed in the place of the placeholder
//   @param {Array<(string|number)>} path - path to value
//   @param {*} whole object (2rd parameter of getValuesByStructure)
//   It returns an object that will be merged to the result
// ----------------------------------------------------------------------------
// INPUT OBJECTS
const obj = {
  array: [{ id: 1 }, ['Andrew', 'Beletskiy'], 3, null, 'something'],
  obj: {
    a: 1,
    b: '2',
    arr: [-1, -2, -3],
    n: null,
    u: undefined
  }
}
const arr = [ obj, 'other', 1, null ]
// ----------------------------------------------------------------------------
// EXAMPLE 1. Get a value from a complex structured object
// First argument of getValuesByStructure is an object, or an array.
// It has the same property names as an object passed as a second argument.
// We can use string placeholders to show where can we find data, and how 
// it must be called in result object of getValuesByStructure function
const structToGetValueFromObj = {
  obj: {
    a: 'stringPlaceholder'
  }
}

const { stringPlaceholder: value1 } = getValuesByStructure(structToGetValueFromObj, obj)
console.log(value1)

// OUTPUT: 1
// ----------------------------------------------------------------------------
// EXAMPLE 2. Get a value from a complex structured object (from array)
// We can use string placeholder placed into array
// Result will contain it as a key with a value placed
// in the same place as the placeholder
const structToGetValueFromArr = {
  obj: {
    arr: ['stringPlaceholder']
  }
}

const { stringPlaceholder: value2 } = getValuesByStructure(structToGetValueFromArr, obj)
console.log(value2)

// OUTPUT: -1
// ----------------------------------------------------------------------------
// EXAMPLE 3. Get a value from a complex structured object (from array)
// `undefined` is just an empty placeholder that will be ignored
const structToGetValueFromArr2 = {
  obj: {
    arr: [undefined, 'stringPlaceholder']
  }
}

const { stringPlaceholder: value3 } = getValuesByStructure(structToGetValueFromArr2, obj)
console.log(value3)
// OUTPUT: -2
// ----------------------------------------------------------------------------
// EXAMPLE 4. Get values from a complex structured object
const structToGetValues = {
  array: [{id: 'first'}],
  obj: {
    b: 'second'
  }
}

const { first, second } = getValuesByStructure(structToGetValues, obj)
console.log(first, second)
// OUTPUT: 1 '2'
// ----------------------------------------------------------------------------
// EXAMPLE 5. If we the second argument object doesn't fit the structure
// not fitting elements will have values undefined
const structToGetValuesNotInObj = {
  notInTheObj: 'third_ex5',
  array: [{id: 'first'}],
  obj: {
    b: 'second'
  }
}

let res = getValuesByStructure(structToGetValuesNotInObj, obj)
console.log(res)
// OUTPUT: { third_ex5: undefined, first: 1, second: '2' }
// ----------------------------------------------------------------------------
// EXAMLE 6: Number placeholder is used to describe which index in array will be
// used to store value.
// If there is only one number placeholder -  result will be an array.
const structToGetArrayAsAResult = {
  array: [0],
  obj: {
    b: 1,
    n: 'a'
  }
}
res = getValuesByStructure(structToGetArrayAsAResult, obj)
console.log(res)
// OUTPUT: [{ id: 1 }, '2', a: null]
// ----------------------------------------------------------------------------
// EXAMLE 7: Function placeholder.
// Function placeholder is used for calculating or formatting of data
// placed on the place of the placeholder
// Function placeholder must return an object. The object will be merged with
// the result of other placeholders. I mean all entries of the function-placeholder
// result will be stored in result object.
const structWithFuncPlaceholder = {
  array: [obj => ({c: obj.id})],
  obj: {
    b: 'b',
    n: 'a'
  }
}
res = getValuesByStructure(structWithFuncPlaceholder, obj)
console.log(res)
// OUTPUT: { c: 1, b: '2', a: null }

// PIPE_VALUES_BY_STRUCTURE EXAMPLES
// pipeValuesByStructure is used to create new structure with using of
// values founded by getValuesByStructure
// It has three arguments
// 1) inputStructure - this is structure that will be used to get values
//   from the object
// 2) outputStructure - this is structure of the resulting object.
//  ( To be accurate, all valid placeholder in this structure will
//    be replaced with values that were get by inputStructure)
// 3) Object with data
//
// It returns object with the same structure as the outputStructure.
// 
// There three possible types of placeholders
// 1) Number placeholder - is used to take data by index from result get by inputStructure
// 2) String placeholder - is used to take data by property name from result
//    get by inputStructure
// 3) Function placeholder - it calculates value based on whole result object get by
//    inputStructure
//  Function placeholder has two params:
//   @param {object} object or an array that will be get from a result of getValuesByStructure(inputStructure, obj)
//   @param {object} object with data (3rd parameter of pipeValuesByStructure)

// EXAMLES:

// Using of number placeholder
console.log(pipeValuesByStructure([100, 200], [200, 100], ['a', 'b']))
// OUTPUT: [ 'b', 'a' ]

// Using of string placeholer
console.log(pipeValuesByStructure([undefined, 'b'], ['b', 'b'], [123, 23]))
// OUTPUT: [ 23, 23 ]

console.log(pipeValuesByStructure([1, 2], [3, 2, 1, 4], [123, 23]))
// OUTPUT: [ undefined, 23, 123, undefined ]

// Using of functional place holder
const inStruct1 = {
  a: 'a',
  b: 'b'
}
const outStruct1 = {
  sum: ({a, b}) => a + b
}
console.log(pipeValuesByStructure(inStruct1, outStruct1, { a: 1, b: 2 }))
// OUTPUT: { sum: 3 }
console.log(pipeValuesByStructure('arr', {
  max: ({ arr }) => Math.max(...arr),
  min: ({ arr }) => Math.min(...arr)
}, [1,2,3,4,5]))
// OUTPUT: { max: 5, min: 1 }
```
