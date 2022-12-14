# React Advanced Function Component

Allows you to **use class advantages** in functional components without additional add-ons.

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

- [afc](#afcafcmemo)
- [afcMemo](#afcafcmemo)

- [fafc](#fafcfafcmemo)
- [fafcMemo](#fafcfafcmemo)

Lifecycle

- [onMount](#onmount)
- [onDestroy](#ondestroy)
- [onDraw](#ondraw)
- [onRender](#onrender)

State

- [createState](#createstate)
- [reactive](#reactive)
- [ref](#ref)
- [handleContext](#handlecontext)

Redux

- [useRedux](#useredux)
- [useActions](#useactions)
- [getDispatch](#getdispatch)

Other

- [onceCreated](#oncecreated)
- [memoized](#memoized)
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

[`afcMemo`](#afcafcmemo)/[`fafcMemo`](#fafcfafcmemo) returns the `memo`-component  
[`afc`](#afcafcmemo)/[`fafc`](#fafcfafcmemo) returns a regular component

Each render uses one `useRef` hook, and the `prop` variable is also updated (excluding the first render).

Calling the following methods adds logic that is used during **each render**:

- [`createState`](#createstate), [`reactive`](#reactive), [`ref`](#ref) adds one **useState** call
- [`useRedux`](#useredux) adds **useSelector** calls depending on the passed object (one key - one hook call)
- [`onDestroy`](#ondestroy), [`onMount`](#onmount), [`onDraw`](#ondraw) adds one **useEffect** call with the passed callback
- [`onRender`](#onrender) adds a call the passed callback (performance directly depends on the actions in it)
- [`handleContext`](#handlecontext) adds one **useContext** call
- [`getDispatch`](#getdispatch), [`useActions`](#useactions) adds one **useDispatch** call
- [`memoized`](#memoized) adds one **useMemo** call

_Note:_ `createState`, `reactive`, `ref`, `getDispatch`, `useActions`, `onDestroy`, `onMount`, `onDraw`
adds one hook call regardless of the number of its calls

Each of the methods can be called an **unlimited** number of times, but only within the constructor
and in functions called from it
(exclution - methods from [_react-afc/compatible_](#compatible-with-non-afc-components)).

## Example

_See the description below_.

```jsx
import { reactive, afcMemo, useActions, useRedux } from 'react-afc'
import { selectName, actions } from './store'

export const Component = afcMemo(props => {  
  const store = useRedux({
    name: selectName
  })

  const state = reactive({
    multiplier: 2,
    number: 5
  })

  function render() {
    const { multiplier, number } = state
    const { name } = store

    return (
      <div>
          <h1>Advanced function component</h1>
          <input value={name} onChange={onChangeName} />
          <input value={multiplier} onChange={onChangeMult} />
          <input value={number} onChange={onChangeNumber} />
          <p>Calculated: {calcValue()}</p>
          <p>Hi, {name}!</p>
      </div>
    )
  }

  const { changeName } = useActions(actions)

  function onChangeMult(event) {
    state.multiplier = +event.currentTarget.value
  }

  function onChangeNumber(event) {
    state.number = +event.currentTarget.value
  }
  
  function onChangeName(event) {
    changeName(event.currentTarget.value)
  }

  function calcValue() {
    return state.multiplier * state.number
  }

  return render
})
```

## Component structure

```jsx
import { afc } from 'react-afc'

const Component = afc(props => {
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
})
```

## State management

To work with the state, use [`reactive`](#reactive)/[`createState`](#createstate)/[`ref`](#ref)

```tsx
import { afc, createState, reactive, ref } from 'react-afc'

const Component = afc(props => {
  const {
    state,
    setAuthor,
    setName,
    // set<Key>
  } = createState({
    author: 'VerZsuT',
    name: 'react-afc'
  })

  function onInput(event) {
    setName(event.target.value)
  }

  /* OR
  const reactiveState = reactive({
    name: 'react-afc'
  })

  function onInput(event) {
    reactiveState.name = event.target.value
  }
  */

  /* OR
  const count = ref(0)

  function onInput(event) {
    count.value = +event.target.value
  }
  */

  function render() {
    return (
      <input onChange={onInput}/>
    )
  }

  return render
})
```

To work with **Redux** use [`useRedux`](#useredux) and [`getDispatch`](#getdispatch)/[`useActions`](#useactions)

```tsx
import { afc, useRedux, getDispatch, useActions } from 'react-afc'
import { actions } from './store'
import { changeCount, selectCount } from './countSlice'

const Component = afc(props => {
  const reduxState = useRedux({
    name: store => store.name.current,
    count: selectCount
  })

  function greet() {
    return `Hi, ${reduxState.name}!`
  }

  const dispatch = getDispatch()
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
})
```

## Working with Context

To use the context, import the [`handleContext`](#handlecontext).

_Returns the context **getter**, not the context itself_.

```jsx
import { afc, handleContext } from 'react-afc'
import CountContext from './CountContext'

const Component = afc(props => {
  const getCount = handleContext(CountContext)

  function calculate() {
    return getCount() * 5
  }

  function render() {
    return (
      <p>Calculated: {calculate()}</p>
    )
  }

  return render
})
```

## Using regular hooks in the body of the "constructor"

```jsx
import { afc, onRender } from 'react-afc'
import { commonHook } from './hooks'

const Component = afc(() => {
  let exampleVar = null

  onRender(() => {
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
})
```

[`onRender`](#onrender) is called immediately and before each render (so as not to break hooks)

```jsx
import { afc, onRender } from 'react-afc'

const Component = afc(props => {
  console.log('Constructor start')
  onRender(() => {
    console.log('onRender')
  })
  console.log('After onRender')

  function render() {
    return (
      <p>onRender</p>
    )
  }

  return render
})
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
import { onMount, onDestroy } from 'react-afc/compatible'

function handleDocumentClick(callback) {
  onMount(() => {
    document.addEventListener('click', callback)
  })
  onDestroy(() => {
    document.removeEventListener('click', callback)
  })
}

const AFCComponent = afc(props => {
  handleDocumentClick(() => {
    // any actions
  })

  function render() {
    return (
      <p>afc component</p>
    )
  }

  return render
})

const CommonComponent = props => {
  // Will not cause errors
  handleDocumentClick(() => {
    // any actions
  })

  return (
    <p>common component</p>
  )
}
```

For single hard calculations use [onceCreated](#oncecreated)

## Common errors

Unpacking at the declaration will break the updating of the props: `name` and `age` will be the same every render

```ts
import { afc } from 'react-afc'

                        // Error !!!
const Component = afc(({ name, age }) => {
  // ...
})
```

Unpacking `state`, `props` or `reduxState` directly in the constructor body will **freeze** these variables:
`name`, `age` and `surname` will not change between renders.

_The exclusion is the case when the received fields do not change during the life of the component_  
_Unpacking in **render function** or handlers does not have such a problem_

```jsx
import { afc, reactive, useRedux } from 'react-afc'

const Component = afc(props => {
  const state = reactive({
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
})
```

It is forbidden to use regular hooks in the constructor without the [`onRender`](#onrender) wrapper.

Since the "constructor" is called once, the call of the usual hooks in it will not be repeated in the render,
which will cause the hooks to break and the application to crash.

The contents of `onRender` are called every render, which ensures that the hooks work correctly.

_Note:_ Use `onRender` only when there is no other way.

```jsx
import { useEffect } from 'react'
import { afc, onRender } from 'react-afc'

const Component = afc(props => {
  useEffect(/*...*/) // Error !!!

  onRender(() => {
    useEffect(/*...*/) // Right
  })

  function render() {
    useEffect(/*...*/) // Right

    return (
      <p>common hooks</p>
    )
  }

  return render
})
```

## API

### afc/afcMemo

```ts
export function afc<P>(constructor: (props: P) => React.FC, options?: AFCOptions): React.FC<P>
export function afcMemo<P>(constructor: (props: P) => React.FC, options?: AFCOptions): ReturnType<React.memo>
```

Accepts a _constructor function_, which should return the usual _component function_.

Returns the wrapped component. Not add an extra node to the virtual DOM.

If you have a problem with the visibility of previous props when they should no longer be,
then set the `lazyPropsUpdate` flag in `options`

```jsx
import { afc } from 'react-afc'

const Component = afc(props => {
  // constructor logic

  function render() {
    return (
      <div>afc/afcMemo</div>
    )
  }

  return render
})
```

### fafc/fafcMemo

```ts
export function fafc<P>(constructor: (props: FastProps<P>) => React.FC): React.FC<P>
export function fafcMemo<P>(constructor: (props: FastProps<P>) => React.FC): ReturnType<React.memo>
type FastProps<P> = { curr: P }
```

Accepts a _constructor function_, which should return the usual _component function_.

Returns the wrapped component. Not add an extra node to the virtual DOM.

_Faster then `afc/afcMemo`_

```jsx
import { fafc } from 'react-afc'

const Component = fafc(props => {
  // constructor logic
  // const { name } = props.curr

  function render() {
    return (
      <div>afc/afcMemo</div>
    )
  }

  return render
})
```

### onDestroy

```ts
export function onDestroy(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was unmounted.

_The same as `useEffect(() => callback, [])`_

```jsx
import { afc, onDestroy } from 'react-afc'
// import { onDestroy } from 'react-afc/compatible'

const Component = afc(props => {
  onDestroy(() => {
    document.removeEventListener(/*...*/)
  })

  function render() {
    return (
      <p>onDestroy</p>
    )
  }

  return render
})
```

### onMount

```ts
export function onMount(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was mounted.

_The same as `useEffect(callback, [])`_

```jsx
import { afc, onMount } from 'react-afc'
// import { onMount } from 'react-afc/compatible'

const Component = afc(props => {
  onMount(() => {
    document.addEventListener(/*...*/)
  })

  function render() {
    return (
      <p>onMount</p>
    )
  }

  return render
})
```

### onDraw

```ts
export function onDraw(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was drawn.

_The same as `useLayoutEffect(() => {...}, [])`_

```jsx
import { afc, onDraw } from 'react-afc'
// import { onDraw } from 'react-afc/compatible'

const Component = afc(props => {
  onDraw(() => {
    document.addEventListener(/*...*/)
  })

  function render() {
    return (
      <p>onDraw</p>
    )
  }

  return render
})
```

### memoized

```ts
export function memoized<T>(factory: () => T, depsGetter: () => any[]): () => T
```

Creates a memoized value getter

```jsx
import { afc, memoized, reactive } from 'react-afc'
// import { memoized } from 'react-afc/compatible'

const Component = afc(props => {
  const state = reactive({
    count: 0,
    mult: 0
  })

  const getResult = memoized(
    () => ({ result: count * mult }),
    () => [state.count, state.mult]
  )

  function render() {
    return (
      <Component result={getResult()}/>
    )
  }

  return render
})
```

### createState

```ts
export function createState<S>(initial: S): StateReturns<S>
```

Accepts a state object.

Returns the object `{ state, set<Key> }`.

_Has a superficial comparison of objects_.

```jsx
import { afc, createState } from 'react-afc'
// import { createState } from 'react-afc/compatible'

const Component = afc(props => {
  const { state, setName, setAge } = createState({
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
})
```

### reactive

```ts
export function reactive<S>(initial: S): S
```

Accepts a state object.

Returns a copy of the state object.  
When it is changed, the component is updated.

```jsx
import { afc, reactive } from 'react-afc'
// import { reactive } from 'react-afc/compatible'

const Component = afc(props => {
  const state = reactive({
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
})
```

### ref

```ts
export function ref<T>(initial: T): { value: T }
```

Accepts the initial state of the reactive reference.

Returns a reactive reference.  
When the value of the link changes, the component will be updated.

```jsx
import { afc, ref } from 'react-afc'
// import { ref } from 'react-afc/compatible'

const Component = afc(props => {
  const count = ref(0)
  const text = ref(null)

  function onClick() {
    count.value++
    text.valie = 'example'
  }

  function render() {
    return <>
      <p>Count: {count.value}</p>
      <p>Text: {text.value}</p>
      <button onClick={onClick}>
        Change state
      </button>
    </>
  }

  return render
})
```

### onRender

```ts
export function onRender(callback: () => void): void
```

Accepts a function without arguments.

Calls it immediately and before each render.

```jsx
import { afc, onRender } from 'react-afc'
// import { onRender } from 'react-afc/compatible'

import { anyCommonHook } from './hooks'

const Component = afc(props => {
  onRender(() => {
    useEffect(/*...*/)
    anyCommonHook()
  })

  function render() {
    return <p>onRender</p>
  }

  return render
})
```

### handleContext

```ts
export function handleContext<T>(context: React.Context<T>): () => T
```

Accepts a context object.

Subscribes to context changes and returns `contextGetter`.

```jsx
import { afc, handleContext } from 'react-afc'
// import { handleContext } from 'react-afc/compatible'

import { NameContext } from './NameContext'

const Component = afc(props => {
  const getContext = handleContext(NameContext)

  function greet() {
    const name = getContext()
    return `Hi, ${name}!`
  }

  function render() {
    return (
      <p>{greet()}</p>
    )
  }

  return render
})
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

const Component = afc(props => {
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
})
```

### getDispatch

```ts
export function getDispatch<T>(): T
```

Doesn't accept anything.

Returns **redux dispatch**.

```jsx
import { afc, getDispatch } from 'react-afc'
// import { getDispatch } from 'react-afc/compatible'

import { changeName, changeAge } from './personSlice'

const Component = afc(props => {
  const dispatch = getDispatch()

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
})
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

const Component = afc(props => {
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
})
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

const Component = () => {
  const message = localMessages.getMessage()
}
```

### onceCreated

```ts
export function onceCreated<T>(factory: () => T): T
```

Calls the passed function once. Returns its cached value.

```jsx
import { afc } from 'react-afc'
import { onceCreated, onMount } from 'react-afc/compatible'

function withHardCalc() {
  const bigValue = onceCreated(() => {/* calculations */})
  
  onMount(() => {
    console.log(bigValue)
  })
}

const AFCComponent = afc(props => {
  withHardCalc()
  return () => <p>content</p>
})

const CommonComponent = props => {
  // It will work the same way as in the afc component.
  // Will not cause errors.
  withHardCalc()
  return <p>content</p>
}
```
