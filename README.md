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
- [useRef](#useref)
- [useForceUpdate](#useforceupdate)

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

[`afcMemo`](#afc-afcmemo)/[`fafcMemo`](#fafc-fafcmemo)/[`pafcMemo`](#pafc-pafcmemo) returns the `memo`-component  
[`afc`](#afc-afcmemo)/[`fafc`](#fafc-fafcmemo)/[`pafc`](#pafc-pafcmemo) returns a regular component

Each render uses one `useRef` hook, and the `props` is updated (excluding the first render).

Calling the following methods adds logic that is used during **each render**:

- [`useObjectState`](#useobjectstate) /
  [`useReactive`](#usereactive) /
  [`useState`](#usestate)
  adds one **React.useState** call
- [`useRedux`](#useredux)
  adds **ReactRedux.useSelector** calls depending on the passed object (one key - one hook call)
- [`useOnDestroy`](#useondestroy) /
  [`useOnMount`](#useonmount) /
  [`useOnDraw`](#useondraw) /
  [`useEffect`](#useeffect) /
  [`useLayoutEffect`](#uselayouteffect)
  adds one **React.useEffect** call with the passed callback
- [`useOnRender`](#useonrender) 
  adds a call the passed callback (performance directly depends on the actions in it)
- [`useContext`](#usecontext)
  adds one **React.useContext** call
- [`useDispatch`](#usedispatch) /
  [`useActions`](#useactions)
  adds one **ReactRedux.useDispatch** call
- [`useMemo`](#usememo)
  adds one **React.useMemo** call

_Note:_ All of them except `useRedux` / `useOnRender` adds one hook call regardless of the number of its calls

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
[`useReactive`](#usereactive) /
[`useObjectState`](#useobjectstate) /
[`useState`](#usestate)

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

To work with **Redux** use [`useRedux`](#useredux) and [`useDispatch`](#usedispatch) / [`useActions`](#useactions)

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

Or use [wrapStaticHook](#wrapstatichook) / [wrapDynamicHook](#wrapdynamichook)

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

[`useOnRender`](#useonrender) is called immediately and before each render (so as not to break hooks)

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

It is forbidden to use regular hooks in the constructor without the [`useOnRender`](#useonrender) wrapper.

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

  return () => (
    <div>example text</div>
  )
}

export default afc(Component)
```

### fafc fafcMemo

```ts
export function fafc<P>(constructor: FAFC<P>): React.FC<P>
export function fafcMemo<P>(constructor: FAFC<P>): ReturnType<React.memo>
type FastProps<P> = { val: P }
```

Accepts a _constructor function_, which should return the usual _component function_.

Returns the wrapped component. Not add an extra node to the virtual DOM.

_Faster then `afc/afcMemo`_

```jsx
import { fafc } from 'react-afc'

function Component(props) {
  // constructor logic

  // IMPORTANT:
  // const { name } = props.val

  return () => {/*...*/}
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

  return () => {/*...*/}
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

function Component(props) {
  useOnDestroy(() => {
    document.removeEventListener(/*...*/)
  })

  return () => {/*...*/}
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

function Component(props) {
  useOnMount(() => {
    document.addEventListener(/*...*/)
  })

  return () => (/*...*/)
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

function Component(props) {
  useOnDraw(() => {
    document.addEventListener(/*...*/)
  })

  return () => (/*...*/)
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
import OtherComponent from './OtherComponent'

function Component(props) {
  const state = useReactive({
    count: 0,
    mult: 0
  })

  const getResult = useMemo(
    () => ({ result: count * mult }),
    () => [state.count, state.mult]
  )

  return () => (
    <OtherComponent result={getResult()}/>
  )
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

function Component(props) {
  const { state, setName, setAge } = useObjectState({
    name: 'Boris',
    age: 30
  })

  function changeAge() {
    setAge(20)
  }

  return () => <>
    <p>Name: {state.name}</p>
    <p>Age: {state.age}</p>
    <button onClick={changeAge}>
      Change age
    </button>
  </>
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

  return () => <>
    <p>Count: {state.count}</p>
    <input value={state.count} onChange={onCountInput}/>
    <button onClick={onButtonClick}>
      count++
    </button>
  </>
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

function Component(props) {
  const [count, setCount] = useState(0)

  function onCountInput(event) {
    setCount(+event.target.value)
  }

  function onButtonClick() {
    setCount(count.val + 1)
  }

  return () => <>
    <p>Count: {count.val}</p>
    <input value={count.val} onChange={onCountInput}/>
    <button onClick={onButtonClick}>
      count++
    </button>
  </>
}

export default afc(Component)
```

### useRef

```ts
export function useRef<T>(initial: T): { current: T }
```

Accepts the initial reference value.

```jsx
import { afc, useForceUpdate, useRef } from 'react-afc'

function Component(props) {
  const count = useRef(0)
  const text = useRef(null)

  const forceUpdate = useForceUpdate()

  function changeRefs() {
    count.current++
    text.current = 'example'
    forceUpdate()
  }

  return () => <>
    <p>Count: {count.current}</p>
    <p>Text: {text.current}</p>
    <button onClick={changeRefs}>
      Change refs
    </button>
  </>
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

import { anyCommonHook } from './hooks'

function Component(props) {
  useOnRender(() => {
    reactUseEffect(/*...*/)
    anyCommonHook()
  })

  return () => {/*...*/}
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

function Component(props) {
  let dependency = 0

  useEffect(() => {
    // any actions
  }, () => [dependency])

  return () => {/*...*/}
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

function Component(props) {
  let dependency = 0

  useLayoutEffect(() => {
    // any actions
  }, () => [dependency])

  return () => {/*...*/}
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
import { NameContext } from './NameContext'

function Component(props) {
  const context = useContext(NameContext)

  function greet() {
    const name = context.val
    return `Hi, ${name}!`
  }

  return () => (
    <p>{greet()}</p>
  )
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
import { selectName, selectAge } from './personSlice'

function Component(props) {
  const store = useRedux({
    name: selectName,
    age: selectAge,
    count: s => s.count.value
  })

  return () => (
    <p>Name: {store.name}; Age: {store.age}; Count {store.count}</p>
  )
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
import { changeName, changeAge } from './personSlice'

function Component(props) {
  const dispatch = useDispatch()

  function onChangeName() {
    dispatch(changeName('New name'))
  }

  function onChangeAge() {
    dispatch(changeAge(10))
  }

  return () => <>
    <button onClick={() => onChangeName('new name')}>
      Change name
    </button>
  </>
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
import { actions } from './store'

function Component(props) {
  const { changeCount } = useActions(actions)

  function setCountToFive() {
    changeCount(5)
  }

  return () => (
    <button onClick={setCountToFive}>
      Change count
    </button>
  )
}

export default afc(Component)
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
  return () => (
    <p>content</p>
  )
})

function CommonComponent(props) {
  // It will work the same way as in the afc component.
  // Will not cause errors.
  withHardCalc()
  return (
    <p>content</p>
  )
}
```

### wrapStaticHook

```ts
export function wrapStaticHook<T extends (...args: any[]) => any>(hook: T): T
```

Wraps the original hook. Allows you to use it in `afc` components.

The return value does not change (static hook).

```jsx
import { afc, wrapStaticHook } from 'react-afc'
import { externalHook } from './hooks'

const staticHook = wrapStaticHook(externalHook)

function Component(props) {
  const value = staticHook('Any static property')

  return () => (
    <p>Static value: {value}</p>
  )
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
import { afc, wrapDynamicHook } from 'react-afc'
import { externalHook } from './hooks'

const dynamicHook = wrapDynamicHook(externalHook)

function Component(props) {
  let dynamicArgument = 5
  const dynResult = dynamicHook(() => [dynamicArgument])

  return () => (
    <p>Dynamic value: {dynResult.val}</p>
  )
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

  return () => <>
    <p>Random number: {Math.random()}</p>
    <button onClick={forceUpdate}>
      Force update
    </button>
  </>
}

export default afc(Component)
```
