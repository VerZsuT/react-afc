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

**API**

Component

- [afc/afcMemo](#afc-afcmemo)
- [fafc/fafcMemo](#fafc-fafcmemo)
- [pafc/pafcMemo](#pafc-pafcmemo)

Lifecycle

- [useOnMount](#useonmount)
- [useOnDestroy](#useondestroy)
- [useOnDraw](#useondraw)
- [useOnRender](#useonrender)
- [useEffect](#useeffect)
- [useLayoutEffect](#uselayouteffect)

State

- [useState](#usestate)
- [useObjectState](#useobjectstate)
- [useReactive](#usereactive)
- [useRef](#useref)
- [useContext](#usecontext)

Redux

- [useRedux](#useredux)
- [useActions](#useactions)
- [useDispatch](#usedispatch)

Other

- [wrapStaticHook](#wrapstatichook)
- [wrapDynamicHook](#wrapdynamichook)
- [useOnceCreated](#useoncecreated)
- [useMemo](#usememo)
- [useForceUpdate](#useforceupdate)
- [Injectable](#injectable)
- [inject](#inject)

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

[`afcMemo`](#afc-afcmemo)/[`fafcMemo`](#fafc-fafcmemo) returns the `memo`-component  
[`afc`](#afc-afcmemo)/[`fafc`](#fafc-fafcmemo) returns a regular component

Each render uses one `useRef` hook, and the `prop` variable is also updated (excluding the first render).

Calling the following methods adds logic that is used during **each render**:

- [`useObjectState`](#useobjectstate), [`useReactive`](#usereactive), [`useRef`](#useref) adds one **useState** call
- [`useRedux`](#useredux) adds **useSelector** calls depending on the passed object (one key - one hook call)
- [`useOnDestroy`](#useondestroy), [`useOnMount`](#useonmount), [`useOnDraw`](#useondraw) adds one **useEffect** call with the passed callback
- [`useOnRender`](#useonrender) adds a call the passed callback (performance directly depends on the actions in it)
- [`useContext`](#usecontext) adds one **React.useContext** call
- [`useDispatch`](#usedispatch), [`useActions`](#useactions) adds one **ReactRedux.useDispatch** call
- [`useMemo`](#usememo) adds one **React.useMemo** call

_Note:_ `useObjectState`, `useReactive`, `useRef`, `useDispatch`, `useActions`, `useOnDestroy`, `useOnMount`, `useOnDraw` adds one hook call regardless of the number of its calls

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

  function render() {
    const { name } = store

    return (
      <div>
          <h1>Advanced function component</h1>
          <input value={name} onChange={onChangeName} />
          <input value={multiplier.val} onChange={onChangeMult} />
          <input value={number.val} onChange={onChangeNumber} />
          <p>Calculated: {calcValue()}</p>
          <p>Hi, {name}!</p>
      </div>
    )
  }

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

  return render
}

export default afcMemo(Component)
```

## Component structure

```jsx
import { afc } from 'react-afc'

function Component(props) {
  // The body of the "constructor".
  // Is called once (before the first render).
  // Hooks only in 'onRender'.

  function render() {
    // render-function, as in a regular component.
    // Every render is called.
    return (
      <div>content</div>
    )
  }

  return render
}

export default afc(Component)
```

## State management

To work with the state, use [`useReactive`](#usereactive)/[`useObjectState`](#useobjectstate)/[`useRef`](#useref)/[`useState`](#usestate)

```tsx
import { afc, useObjectState, useReactive, useRef, useState } from 'react-afc'

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

  // useRef
  const nameRef = useRef('Name', true)
  const surnameRef = useRef('Surname', true)

  function changeState3() {
    nameRef.current = 'New name'
    surnameRef.current = 'New surname'
  }

  // useState
  const [name, setName] = useState('Name')
  const [surname, setSurname] = useState('Surname')

  function changeState4() {
    setName('New name')
    setSurname('New surname')
  }

  function render() {
    // any
  }

  return render
}

export default afc(Component)
```

To work with **Redux** use [`useRedux`](#useredux) and [`useDispatch`](#usedispatch)/[`useActions`](#useactions)

```tsx
import { afc, useRedux, useDispatch, useActions } from 'react-afc'
import { actions } from './store'
import { changeCount, selectCount } from './countSlice'

function Component(props) {
  const store = useRedux({
    name: store => store.name.current,
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

  function render() {
    return <>
      <input onChange={onChange}/>
      <button onClick={onDelCount}>
        Delete counter
      </button>
    </>
  }

  return render
}

export default afc(Component)
```

## Working with Context

To use the context, import the [`useContext`](#usecontext).

_Returns `{ val: <context_value> }`, not the context itself_.

```jsx
import { afc, useContext } from 'react-afc'
import CountContext from './CountContext'

function Component(props) {
  const count = useContext(CountContext)

  function calculate() {
    return count.val * 5
  }

  function render() {
    return (
      <p>Calculated: {calculate()}</p>
    )
  }

  return render
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

  function render() {
    // OR
    // exampleVar = commonHook()
    return (
      <p>Variable: {exampleVar}</p>
    )
  }

  return render
}

export default afc(Component)
```

Or use [wrapStaticHook](#wrapstatichook)/[wrapDynamicHook](#wrapdynamichook) from _`react-afc/compatible`_

```jsx
import { afc, useOnRender, useForceUpdate } from 'react-afc'
import { wrapStaticHook, wrapDynamicHook } from 'react-afc/compatible'

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
  const dynamicHook = dynamicHook(() => [number])

  const forceUpdate = useForceUpdate()
  function render() {
    number++
    return <>
      <p>Static result: {staticResult}</p>
      <p>Dynamic result: {dynamicResult}</p>
      <button onClick={forceUpdate}>
        Force update
      </button>
    </>
  }

  return render
}

export default afc(Component)
```

[`useOnRender`](#useonrender) is called immediately and before each render (so as not to break hooks)

```jsx
import { afc, useOnRender } from 'react-afc'

function Component(props) {
  console.log('Constructor start')
  useOnRender(() => {
    console.log('onRender')
  })
  console.log('After onRender')

  function render() {
    return (
      <p>onRender</p>
    )
  }

  return render
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

They have slightly less performance (+1 boolean check in each call).

When called in an _afc_ component, they work like normal methods for 'constructor'. When called in a regular component,
they use adapted versions that do not cause errors and do the same job as in 'constructor'.

_Note:_ Use compatible methods only in reused functions.
In other cases, the fastest option will be the usual methods from `react-afc`.

```jsx
import { afc } from 'react-afc'
import { useOnMount, useOnDestroy, wrapDynamicHook } from 'react-afc/compatible'
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

  function render() {
    return (
      <p>afc component</p>
    )
  }

  return render
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

For single hard calculations use [useOnceCreated](#useoncecreated)

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
    count: store => store.count.value
  })

  const { name, age } = state // Error, freeze !!!
  const { count } = store
  const { surname } = props

  function onClick() {
    const { name, age } = state // Right, always relevant
    const { count } = store
    const { surname } = props
  }

  function render() {
    return (
      <button onClick={onClick}>
        Click me
      </button>
    )
  }

  return render
}

export default afc(Component)
```

It is forbidden to use regular hooks in the constructor without the [`useOnRender`](#useonrender) wrapper.

Since the "constructor" is called once, the call of the usual hooks in it will not be repeated in the render,
which will cause the hooks to break and the application to crash.

The contents of `onRender` are called every render, which ensures that the hooks work correctly.

_Note:_ Use `onRender` only when there is no other way.

```jsx
import { useEffect as reactUseEffect } from 'react'
import { afc, useOnRender } from 'react-afc'

function Component(props) {
  reactUseEffect(/*...*/) // Error !!!

  useOnRender(() => {
    reactUseEffect(/*...*/) // Right
  })

  function render() {
    reactUseEffect(/*...*/) // Right

    return (
      <p>common hooks</p>
    )
  }

  return render
}

export default afc(Component)
```

## API

### afc afcMemo

```ts
export function afc<P>(constructor: AFC<P>, options?: AFCOptions): React.FC<P>
export function afcMemo<P>(constructor: AFC<P>, options?: AFCOptions): ReturnType<React.memo>
```

Accepts a _constructor function_, which should return the usual _component function_.

Returns the wrapped component. Not add an extra node to the virtual DOM.

If you have a problem with the visibility of previous props when they should no longer be,
then set the `lazyPropsUpdate` flag in `options`

```jsx
import { afc } from 'react-afc'

function Component(props) {
  // constructor logic

  function render() {
    return (
      <div>afc/afcMemo</div>
    )
  }

  return render
}

export default afc(Component)
```

### fafc fafcMemo

```ts
export function fafc<P>(constructor: FAFC<P>): React.FC<P>
export function fafcMemo<P>(constructor: FAFC<P>): ReturnType<React.memo>
type FastProps<P> = { curr: P }
```

Accepts a _constructor function_, which should return the usual _component function_.

Returns the wrapped component. Not add an extra node to the virtual DOM.

_Faster then `afc/afcMemo`_

```jsx
import { fafc } from 'react-afc'

function Component(props) {
  // constructor logic

  // IMPORTANT:
  // const { name } = props.curr

  function render() {
    return (
      <div>afc/afcMemo</div>
    )
  }

  return render
}

export default fafc(Component)
```

### pafc pafcMemo

```ts
export function pafc(constructor: PAFC): React.FC<P>
export function fafcMemo(constructor: PAFC): ReturnType<React.memo>
```

Accepts a _constructor function_, which should return the usual _component function_.

Returns the wrapped component. Not add an extra node to the virtual DOM.

_Does not accept or transmit props._

```jsx
import { pafc } from 'react-afc'

function Component() {
  // constructor logic

  function render() {
    return (
      <div>afc/afcMemo</div>
    )
  }

  return render
}

export default pafc(Component)
```

### useOnDestroy

```ts
export function useOnDestroy(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was unmounted.

_The same as `React.useEffect(() => callback, [])`_

```jsx
import { afc, useOnDestroy } from 'react-afc'
// import { useOnDestroy } from 'react-afc/compatible'

function Component(props) {
  useOnDestroy(() => {
    document.removeEventListener(/*...*/)
  })

  function render() {
    return (
      <p>onDestroy</p>
    )
  }

  return render
}

export default afc(Component)
```

### useOnMount

```ts
export function useOnMount(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was mounted.

_The same as `React.useEffect(callback, [])`_

```jsx
import { afc, useOnMount } from 'react-afc'
// import { useOnMount } from 'react-afc/compatible'

function Component(props) {
  useOnMount(() => {
    document.addEventListener(/*...*/)
  })

  function render() {
    return (
      <p>onMount</p>
    )
  }

  return render
}

export default afc(Component)
```

### useOnDraw

```ts
export function useOnDraw(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was drawn.

_The same as `React.useLayoutEffect(() => callback, [])`_

```jsx
import { afc, useOnDraw } from 'react-afc'
// import { useOnDraw } from 'react-afc/compatible'

function Component(props) {
  useOnDraw(() => {
    document.addEventListener(/*...*/)
  })

  function render() {
    return (
      <p>onDraw</p>
    )
  }

  return render
}

export default afc(Component)
```

### useMemo

```ts
export function useMemo<T>(factory: () => T, depsGetter: () => any[]): () => T
```

Creates a memoized value getter

```jsx
import { afc, useMemo, useReactive } from 'react-afc'
// import { useMemo } from 'react-afc/compatible'

function Component(props) {
  const state = useReactive({
    count: 0,
    mult: 0
  })

  const getResult = useMemo(
    () => ({ result: count * mult }),
    () => [state.count, state.mult]
  )

  function render() {
    return (
      <Component result={getResult()}/>
    )
  }

  return render
}

export default afc(Component)
```

### useObjectState

```ts
export function useObjectState<S>(initial: S): ObjectState<S>
```

Accepts a state object.

Returns the object `{ state, set<Key> }`.

_Has a superficial comparison of objects_.

```jsx
import { afc, useObjectState } from 'react-afc'
// import { useObjectState } from 'react-afc/compatible'

function Component(props) {
  const { state, setName, setAge } = useObjectState({
    name: 'Boris',
    age: 30
  })

  function changeAge() {
    setAge(20) // State: { name: 'Boris', age: 20 }
  }

  function render() {
    const { name, age } = state

    return <>
      <p>Name: {name}</p>
      <p>Age: {age}</p>
      <button onClick={changeAge}>
        Change age
      </button>
    </>
  }

  return render
}

export default afc(Component)
```

### useReactive

```ts
export function useReactive<S>(initial: S): S
```

Accepts a state object.

Returns a copy of the state object.  
When it is changed, the component is updated.

```jsx
import { afc, useReactive } from 'react-afc'
// import { useReactive } from 'react-afc/compatible'

function Component(props) {
  const state = useReactive({
    count: 0
  })

  function onCountInput(event) {
    state.count = +event.target.value
  }

  function onButtonClick() {
    state.count++
  }

  function render() {
    const { count } = state

    return <>
      <p>Count: {count}</p>
      <input value={count} onChange={onCountInput}/>
      <button onClick={onButtonClick}>
        count++
      </button>
    </>
  }

  return render
}

export default afc(Component)
```

### useState

```ts
export function useState<T>(initial: T): [{ val: T }, (value: T) => void]
```

Accepts a initial state.

When value is changed, the component is updated.

```jsx
import { afc, useState } from 'react-afc'
// import { useState } from 'react-afc/compatible'

function Component(props) {
  const [count, setCount] = useState(0)

  function onCountInput(event) {
    setCount(+event.target.value)
  }

  function onButtonClick() {
    setCount(count.val + 1)
  }

  function render() {
    const { count } = state

    return <>
      <p>Count: {count}</p>
      <input value={count} onChange={onCountInput}/>
      <button onClick={onButtonClick}>
        count++
      </button>
    </>
  }

  return render
}

export default afc(Component)
```

### useRef

```ts
export function useRef<T>(initial: T, isReactive = false): { current: T }
```

Accepts the initial state of the reactive reference.

Returns a reactive reference.  
When the value of the link changes, the component will be updated (`isReactive` is `true`).

```jsx
import { afc, useRef } from 'react-afc'
// import { useRef } from 'react-afc/compatible'

function Component(props) {
  const count = useRef(0, true)
  const text = useRef(null, true)

  function onClick() {
    count.current++
    text.current = 'example'
  }

  function render() {
    return <>
      <p>Count: {count.current}</p>
      <p>Text: {text.current}</p>
      <button onClick={onClick}>
        Change state
      </button>
    </>
  }

  return render
}

export default afc(Component)
```

### useOnRender

```ts
export function useOnRender(callback: () => void): void
```

Accepts a function without arguments.

Calls it immediately and before each render.

```jsx
import { useEffect as reactUseEffect } from 'react'
import { afc, useOnRender } from 'react-afc'
// import { useOnRender } from 'react-afc/compatible'

import { anyCommonHook } from './hooks'

function Component(props) {
  useOnRender(() => {
    reactUseEffect(/*...*/)
    anyCommonHook()
  })

  function render() {
    return <p>onRender</p>
  }

  return render
}

export default afc(Component)
```

### useEffect

```ts
export function useEffect(callback: React.EffectCallback, deps?: () => React.DependencyList): void
```

Analog `React.useEffect(callback, deps())`

```jsx
import { afc, useEffect } from 'react-afc'
// import { useEffect } from 'react-afc/compatible'

function Component(props) {
  let dependency = 0

  useEffect(() => {
    // any actions
  }, () => [dependency])

  function render() {
    return <p>onRender</p>
  }

  return render
}

export default afc(Component)
```

### useLayoutEffect

```ts
export function useLayoutEffect(callback: React.EffectCallback, deps?: () => React.DependencyList): void
```

Analog `React.useLayoutEffect(callback, deps())`

```jsx
import { afc, useLayoutEffect } from 'react-afc'
// import { useLayoutEffect } from 'react-afc/compatible'

function Component(props) {
  let dependency = 0

  useLayoutEffect(() => {
    // any actions
  }, () => [dependency])

  function render() {
    return <p>onRender</p>
  }

  return render
}

export default afc(Component)
```

### useContext

```ts
export function useContext<T>(context: React.Context<T>): { val: T }
```

Accepts a context object.

Subscribes to context changes and returns `{ val: <context_value> }`.

```jsx
import { afc, useContext } from 'react-afc'
// import { useContext } from 'react-afc/compatible'

import { NameContext } from './NameContext'

function Component(props) {
  const context = useContext(NameContext)

  function greet() {
    const name = context.val
    return `Hi, ${name}!`
  }

  function render() {
    return (
      <p>{greet()}</p>
    )
  }

  return render
}

export default afc(Component)
```

### useRedux

```ts
export function useRedux<T>(config: T): {
  [key in keyof T]: ReturnType<T[key]>
}
```

Accepts a config object of the form `{ key: selector }`.

Subscribes to the change of the store and returns an object of the form `{ key: value_from_selector }`.

```jsx
import { afc, useRedux } from 'react-afc'
// import { useRedux } from 'react-afc/compatible'

import { selectName, selectAge } from './personSlice'

function Component(props) {
  const store = useRedux({
    name: selectName,
    age: selectAge,
    count: state => state.count.value
  })

  function func() {
    const { name, age, count } = store
  }

  function render() {
    return (
      <p>Name: {store.name}; Age: {store.age}</p>
    )
  }

  return render
}

export default afc(Component)
```

### useDispatch

```ts
export function useDispatch<T>(): T
```

Doesn't accept anything.

Returns **redux dispatch**.

```jsx
import { afc, useDispatch } from 'react-afc'
// import { useDispatch } from 'react-afc/compatible'

import { changeName, changeAge } from './personSlice'

function Component(props) {
  const dispatch = useDispatch()

  function onChangeName(value) {
    dispatch(changeName(value))
  }

  function onChangeAge(value) {
    dispatch(changeAge(value))
  }

  function render() {
    return <>
      <button onClick={() => onChangeName('new name')}>
        Change name
      </button>
    </>
  }

  return render
}

export default afc(Component)
```

### useActions

```ts
export function useActions<T>(actions: T): T
```

Accepts a redux actions

Returns wrapped actions. They can be used without dispatcher.

```jsx
import { afc, useActions } from 'react-afc'
// import { useActions } from 'react-afc/compatible'

import { actions } from './store'

function Component(props) {
  const { changeCount } = useActions(actions)

  function setCountToFive() {
    changeCount(5)
  }

  function render() {
    return (
      <button onClick={setCountToFive}>
        Change count
      </button>
    )
  }

  return render
}

export default afc(Component)
```

### Injectable

```ts
export function Injectable<T extends Constructable>(Constructable: T): Injectable
```

Marks the class as _injectable_, which allows you to use it in the `inject`.

```ts
import { Injectable } from 'react-afc'

@Injectable
export class LocalMessagesService {
  private key = 'MESSAGE'
  
  getMessage(): string {
    return localStorage.getItem(this.key)
  }
}
```

### inject

```ts
export function inject<T extends Injectable>(Type: T): InstanceType<T>
```

Simulates the operation of Dependency Injection.
Returns the only instance of the passed class.

```js
import { inject } from 'react-afc'
import { LocalMessagesService } from './LocalMessagesService'

const localMessages = inject(LocalMessagesService)

function Component() {
  const message = localMessages.getMessage()
}
```

### useOnceCreated

```ts
export function useOnceCreated<T>(factory: () => T): T
```

Calls the passed function once. Returns its cached value.

```jsx
import { afc } from 'react-afc'
import { useOnceCreated, useOnMount } from 'react-afc/compatible'

function withHardCalc() {
  const bigValue = useOnceCreated(() => {/* calculations */})
  
  useOnMount(() => {
    console.log(bigValue)
  })
}

const AFCComponent = afc(props => {
  withHardCalc()
  return () => <p>content</p>
})

function CommonComponent(props) {
  // It will work the same way as in the afc component.
  // Will not cause errors.
  withHardCalc()
  return <p>content</p>
}
```

### wrapStaticHook

```ts
export function wrapStaticHook<T extends (...args: any[]) => any>(hook: T): T
```

Wraps the original hook. Allows you to use it in `afc` components.

The return value does not change (static hook).

```jsx
import { afc } from 'react-afc'
import { wrapStaticHook } from 'react-afc/compatible'
import { externalHook } from './hooks'

const staticHook = wrapStaticHook(externalHook)

function Component(props) {
  const value = staticHook('Any static property')

  function render() {
    return <p>Static value: {value}</p>
  }

  return render
}

export default afc(Component)
```

### wrapDynamicHook

```ts
export function wrapDynamicHook<T extends (...args: any[]) => any>(hook: T)
```

Wraps the original hook. Allows you to use it in `afc` components.

The return value is calculated every render (dynamic hook).

```jsx
import { afc } from 'react-afc'
import { wrapDynamicHook } from 'react-afc/compatible'
import { externalHook } from './hooks'

const dynamicHook = wrapDynamicHook(externalHook)

function Component(props) {
  let dynamicArgument = 5
  const value = dynamicHook(() => [dynamicArgument])

  function render() {
    return <p>Dynamic value: {value}</p>
  }

  return render
}

export default afc(Component)
```

### useForceUpdate

```ts
export function useForceUpdate(): () => void
```

Returns a function that forcibly updates the component.

```jsx
import { afc, useForceUpdate } from 'react-afc'

function Component(props) {
  const forceUpdate = useForceUpdate()

  function render() {
    return <>
      <p>Random number: {Math.random()}</p>
      <button onClick={forceUpdate}>
        Force update
      </button>
    </>
  }

  return render
}

export default afc(Component)
```
