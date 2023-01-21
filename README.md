# React Advanced Function Component (AFC)

Allows you to **simplify optimization**.

_Full type support._

# Table of contents

**About the package**

- [Installation](#installation)
- [Why](#why)
- [When to use](#when-to-use)
- [What gives](#what-gives)
- [Performance](#performance)
- [Example](#example)
- [Component structure](#component-structure)
- [State management](#state-management)
- [Working with context](#working-with-context)
- [Regular hooks in constructor](#using-regular-hooks-in-the-body-of-the-constructor)
- [Compatible with non-afc components](#compatible-with-non-afc-components)
- [Common errors](#common-errors)
- [API](#api)

## Installation

```npm
npm i react-afc
```

## When to use

When you need to optimize a component by reducing the rerender of child components.

## Why

In order not to write unnecessary `useMemo`, `useCallback` and `useRef`.

## What gives

Allows you to reduce the number of hook calls (which affects both readability and optimization),
and also not to worry about an array of dependencies.

## Performance

The library is optimized as much as possible.

`afcMemo` returns the `memo`-component  
`afc` returns a regular component

Each render uses one `useRef` hook, and the `props` is updated (excluding the first render).

Calling the following methods adds logic that is used during **each render**:

- `useObjectState` /
  `useReactive` /
  `useState`
  adds one **React.useState** call
- `useRedux`
  adds **ReactRedux.useSelector** calls depending on the passed object (one key - one hook call)
- `useOnDestroy` /
  `useOnMount` /
  `useOnDraw` /
  `useEffect` /
  `useLayoutEffect`
  adds one **React.useEffect** call with the passed callback
- `useOnRender`
  adds a call the passed callback (performance directly depends on the actions in it)
- `useContext`
  adds one **React.useContext** call
- `useDispatch` /
  `useActions`
  adds one **ReactRedux.useDispatch** call
- `useMemo`
  adds one **React.useMemo** call

_Note:_ All of them except `useRedux` / `useOnRender` / `useMemo` / `useContext` adds one hook call regardless of the number of its calls

Each of the methods can be called an **unlimited** number of times, but only within the constructor
and in functions called from it
(exclution - methods from [_react-afc/compatible_](#compatible-with-non-afc-components)).

## Example

_See the description below_.

```jsx
import { useState, afcMemo, useActions, useRedux } from 'react-afc'
import { selectName, actions } from './store'

function Component(props) {
  const [multiplier, setMultiplier] = useState(2)
  const [number, setNumber] = useState(5)

  const store = useRedux({
    name: selectName
  })

  const { changeName } = useActions(actions)

  function onChangeMult(event) {
    setMultiplier(+event.currentTarget.value)
  }

  function onChangeNumber(event) {
    setNumber(+event.currentTarget.value)
  }
  
  function onChangeName(event) {
    changeName(event.currentTarget.value)
  }

  function calcValue() {
    return multiplier.val * number.val
  }

  return () => <>
    <h1>Advanced function component</h1>
    <input value={store.name} onChange={onChangeName} />
    <input value={multiplier.val} onChange={onChangeMult} />
    <input value={number.val} onChange={onChangeNumber} />
    <p>Calculated: {calcValue()}</p>
    <p>Hi, {name}!</p>
  </>
}

export default afcMemo(Component)
```

## Component structure

```jsx
import { afc } from 'react-afc'

function Component(props) {
  // The body of the "constructor".
  // Is called once (before the first render).
  // Common hooks must be wrapped or in 'useOnRender'.

  return () => {
    // Render function, as in a regular component.
    // Every render is called.
    return (
      <div>content</div>
    )
  }
}

export default afc(Component)
```

## State management

To work with the state, use
`useReactive` /
`useObjectState` /
`useState`

```jsx
import { afc, useObjectState, useReactive, useState } from 'react-afc'

function Component(props) {
  // useObjectState
  const { state, setName, setSurname } = useObjectState({
    name: 'Name',
    surname: 'Surname'
  })

  function changeState1() {
    setName('New name')
    setSurname('New surname')
  }

  // useReactive
  const reactive = useReactive({
    name: 'Name',
    surname: 'Surname'
  })

  function changeState2() {
    reactive.name = 'New name'
    reactive.surname = 'New surname'
  }

  // useState
  const [name, setName2] = useState('Name')
  const [surname, setSurname2] = useState('Surname')

  function changeState4() {
    setName2('New name')
    setSurname2('New surname')
  }

  return () => {/*...*/}
}

export default afc(Component)
```

To work with **Redux** use `useRedux` and `useDispatch` / `useActions`

```jsx
import { afc, useRedux, useDispatch, useActions } from 'react-afc'
import { actions } from './store'
import { changeCount, selectCount } from './countSlice'

function Component(props) {
  const store = useRedux({
    name: s => s.name.current,
    count: selectCount
  })

  function greet() {
    return `Hi, ${store.name}!`
  }

  const dispatch = useDispatch()
  function onChange(event) {
    dispatch(changeCount(+e.target.value))
  }
  
  // Alternative
  const { delCount } = useActions(actions)
  function onDelCount() {
    delCount()
  }

  return () => <>
    <input onChange={onChange}/>
    <button onClick={onDelCount}>
      Delete counter
    </button>
  </>
}

export default afc(Component)
```

## Working with Context

To use the context, import the `useContext`.

_Returns `{ val: <context_value> }`, not the context itself_.

```jsx
import { afc, useContext } from 'react-afc'
import CountContext from './CountContext'

function Component(props) {
  const count = useContext(CountContext)

  function calculate() {
    return count.val * 5
  }

  return () => (
    <p>Calculated: {calculate()}</p>
  )
}

export default afc(Component)
```

## Using regular hooks in the body of the "constructor"

```jsx
import { afc, useOnRender } from 'react-afc'
import { commonHook } from './hooks'

function Component() {
  let exampleVar = null

  useOnRender(() => {
    exampleVar = commonHook()
  })

  return () => {
    // OR
    // exampleVar = commonHook()
    return (
      <p>Variable: {exampleVar}</p>
    )
  }
}

export default afc(Component)
```

Or use `wrapStaticHook` / `wrapDynamicHook`

```jsx
import { afc, useOnRender, useForceUpdate, wrapStaticHook, wrapDynamicHook } from 'react-afc'

function commonHook(number) {
  // any React common hooks
}

// If the result of the hook does not change
const staticHook = wrapStaticHook(commonHook)
// Else
const dynamicHook = wrapDynamicHook(commonHook)

function Component() {
  let number = 5

  const staticResult = staticHook(number)
  const dynamicResult = dynamicHook(() => [number])
  const forceUpdate = useForceUpdate()

  return () => {
    number++

    return <>
      <p>Static result: {staticResult}</p>
      <p>Dynamic result: {dynamicResult.val}</p>
      <button onClick={forceUpdate}>
        Force update
      </button>
    </>
  }
}

export default afc(Component)
```

`useOnRender` is called immediately and before each render (so as not to break hooks)

```jsx
import { afc, useOnRender } from 'react-afc'

function Component(props) {
  console.log('Constructor start')
  useOnRender(() => {
    console.log('onRender')
  })
  console.log('After onRender')

  return () => (
    <p>onRender</p>
  )
}

export default afc(Component)
```

In this example, the console output will be:

```text
Constructor start
onRender
After onRender
```

And before each next render it will be output to the console

```text
onRender
```

## Compatible with non-afc components

To use the same code in regular and _afc_ components, use the methods from `react-afc/compatible`.

They have slightly less performance.

When called in an _afc_ component, they work like normal methods for 'constructor'. When called in a regular component,
they use adapted versions that do not cause errors and do the same job as in 'constructor'.

_Note:_ Use compatible methods only in reused functions.
In other cases, the fastest option will be the usual methods from `react-afc`.

```jsx
import { afc, wrapDynamicHook } from 'react-afc'
import { useOnMount, useOnDestroy } from 'react-afc/compatible'
import { externalCommonHook } from './hooks'

const afcHook = wrapDynamicHook(externalCommonHook)

function handleDocumentClick(callback) {
  useOnMount(() => {
    document.addEventListener('click', callback)
  })
  useOnDestroy(() => {
    document.removeEventListener('click', callback)
  })
}

const AFCComponent = afc(props => {
  handleDocumentClick(() => {
    // any actions
  })
  afcHook(5)

  return () => (
    <p>afc component</p>
  )
})

function CommonComponent(props) {
  // Will not cause errors
  handleDocumentClick(() => {
    // any actions
  })
  externalCommonHook(5)

  return (
    <p>common component</p>
  )
}
```

For single hard calculations use `useOnceCreated`

## Common errors

Unpacking at the declaration will break the updating of the props: `name` and `age` will be the same every render

```ts
import { afc } from 'react-afc'

                    // Error !!!
function Component({ name, age }) {
  // ...
}

export default afc(Component)
```

Unpacking `state`, `props` or `reduxState` directly in the constructor body will **freeze** these variables:
`name`, `age` and `surname` will not change between renders.

_The exclusion is the case when the received fields do not change during the life of the component_  
_Unpacking in **render function** or handlers does not have such a problem_

```jsx
import { afc, useReactive, useRedux } from 'react-afc'

function Component(props) {
  const state = useReactive({
    name: 'Aleksandr',
    age: 20
  })

  const store = useRedux({
    count: s => s.count.value
  })

  const { name, age } = state // Error, freeze !!!
  const { count } = store
  const { surname } = props

  function onClick() {
    const { name, age } = state // Right, always relevant
    const { count } = store
    const { surname } = props
  }

  return () => (
    <button onClick={onClick}>
      Click me
    </button>
  )
}

export default afc(Component)
```

It is forbidden to use regular hooks in the constructor without the `useOnRender` wrapper.

Since the "constructor" is called once, the call of the usual hooks in it will not be repeated in the render,
which will cause the hooks to break and the application to crash.

The contents of `useOnRender` are called every render, which ensures that the hooks work correctly.

_Note:_ Use `useOnRender` only when there is no other way.

```jsx
import { useEffect as reactUseEffect } from 'react'
import { afc, useOnRender } from 'react-afc'

function Component(props) {
  reactUseEffect(/*...*/) // Error !!!

  useOnRender(() => {
    reactUseEffect(/*...*/) // Right
  })

  return () => {
    reactUseEffect(/*...*/) // Right

    return (
      <p>common hooks</p>
    )
  }
}

export default afc(Component)
```

## API

See [Wiki](https://github.com/VerZsuT/react-afc/wiki)
