# React Advanced Function Component

Allows you to **use class advantages** in functional components without additional add-ons.

Allows you to **simplify optimization**.

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

`afcMemo` returns the `memo`-component
`afc` returns a regular component

Each render uses one `useRef` hook, and the `prop` variable is also updated (excluding the first render).

Calling the following methods adds logic that is used during **each render**:

- `createState`, `reactive`, `ref` adds one **useState** call
- `useRedux` adds `useSelector` calls depending on the passed object (one key - one hook call)
- `onDestroy`, `onMount`, `onDraw` adds one **useEffect** call with the passed callback
- `onRender` adds a call the passed callback (performance directly depends on the actions in it)
- `handleContext` adds one **useContext** call
- `getDispatch`, `useActions` adds one **useDispatch** call
- `memoized` adds one **useMemo** call

_Note:_ `createState`, `reactive`, `ref`, `getDispatch`, `useActions`, `onDestroy`, `onMount`, `onDraw`
adds one hook call regardless of the number of its calls

Each of the methods can be called an **unlimited** number of times, but only within the constructor
and in functions called from it.

## Example

_See the description below_.

```tsx
import type { ChangeEvent } from 'react'
import { reactive, afcMemo, useActions, useRedux } from 'react-afc'
import { selectName, actions } from './store'

type Props = {
  exampleProp: number
}

export const Component = afcMemo((props: Props) => {
  const { changeName } = useActions(actions)
  
  const store = useRedux({
    name: selectName
  })
  const state = reactive({
    multiplier: "2",
    number: "5"
  })

  function render(): ReactNode {
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

  function onChangeMult(e: ChangeEvent<HTMLInputElement>): void {
    state.multiplier = e.currentTarget.value
  }

  function onChangeNumber(e: ChangeEvent<HTMLInputElement>): void {
    state.number = e.currentTarget.value
  }
  
  function onChangeName(e: ChangeEvent<HTMLInputElement>): void {
    changeName(e.currentTarget.value)
  }

  function calcValue(): number {
    return +state.multiplier * +state.number
  }

  return render
})
```

## Component structure

```tsx
import { afc } from 'react-afc'

const Component = afc(props => {
  // The body of the "constructor".
  // Is called once (before the first render).
  // Hooks only in inRender.

  function render(): ReactNode {
    // render-function, as in a regular component.
    // Every render is called.

    return <div>content</div>
  }

  return render
})
```

## State management

To work with the state, use `reactive`/`createState`/`ref`

```ts
import { createState, reactive, ref } from 'react-afc'

//...//
  const { state, setAuthor, setName /* set<Key> */ } = createState({
    author: 'VerZsuT',
    name: 'react-afc'
    // key: value
  })
  function onInput(newName: string): void {
    setName(newName)
  }
// OR //
  const reactiveState = reactive({
    value: 'react-afc'
  })
  function onInput(newVal: string): void {
    reactiveState.value = newVal
  }
// OR //
  const count = ref(0)
  function onInput(newVal: number): void {
    count.value = newVal
  }
//...//
```

To work with **Redux** use `useRedux` and `getDispatch`/`useActions`

```ts
import { useRedux, getDispatch, useActions } from 'react-afc'
import type { Store, AppDispatch } from './store'
import { actions } from './store'
import { changeCount, selectCount } from './countSlice'

//...//
  const reduxState = useRedux({
    name: (store: Store) => store.name.current,
    count: selectCount
    // key: selector
  })
  function greet(): string {
    const {name} = reduxState
    return `Hi, ${name}!`
  }

  const dispatch = getDispatch<AppDispatch>()
  function onChange(value: number): void {
    dispatch(changeCount(value))
  }
  
  // Alternative
  const { delCount } = useActions(actions)
  function onDelCount(): void {
    delCount()
  }
//...//
```

## Working with Context

To use the context, import the `handleContext`.

_Returns the context **getter**, not the context itself_.

```ts
import { handleContext } from 'react-afc'
import CountContext from './CountContext'

//...//
  const getCount = handleContext(CountContext)
  function calculate(): number {
    return getCount() * 5
  }
//...//
```

## Using regular hooks in the body of the "constructor"

```ts
import { onRender } from 'react-afc'

//...//
  let exampleVar: string;
  onRender(() => {
    exampleVar = commonHook()
  })
//...//
```

`onRender` is called immediately and before each render (so as not to break hooks)

```ts
import { onRender } from 'react-afc'

//...//
  console.log('Constructor start')
  onRender(() => {
    console.log('onRender')
  })
  console.log('After onRender')
//...//
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

```tsx
import { afc } from 'react-afc'
import { onMount, onDestroy } from 'react-afc/compatible'

function handleDocumentClick(callback: () => void): void {
  onMount(() => {
    document.addEventListener('click', callback)
  })
  onDestroy(() => {
    document.removeEventListener('click', callback)
  })
}

const AFCComponent = afc(() => {
  handleDocumentClick(() => {
    // any actions
  })
  const render = (): ReactNode => <p>any content</p>
  return render
})

const CommonComponent = () => {
  // Will not cause errors
  handleDocumentClick(() => {
    // any actions
  })
  return <p>any content</p>
}
```

For single hard calculations use [onceCreated](#oncecreated)

## Common errors

Unpacking at the declaration will break the updating of the props: `name` and `age` will be the same every render

```ts
import { afc } from 'react-afc'

type Props = {
  name: string
  age: number
}
                              // Error !!!
const Component = afc<Props>(({ name, age }) => {/*...*/})
```

Unpacking `state`, `props` or `reduxState` directly in the constructor body will **freeze** these variables:
`name`, `age` and `surname` will not change between renders.

_The exclusion is the case when the received fields do not change during the life of the component_  
_Unpacking in **render function** or handlers does not have such a problem_

```ts
import { reactive, useRedux } from 'react-afc'
import type { RootState } from './state'

//...//
  const state = reactive({
    name: 'Aleksandr',
    age: 20
  })
  const store = useRedux({
    count: (state: RootState) => state.count.value
  })
  const { name, age } = state // Error, freeze !!!
  const { count } = store
  const { surname } = props

  function onClick(): void {
    const { name, age } = state // Right, always relevant
    const { count } = store
    const { surname } = props
  }
//...//
```

It is forbidden to use regular hooks in the constructor without the `onRender` wrapper.

Since the "constructor" is called once, the call of the usual hooks in it will not be repeated in the render,
which will cause the hooks to break and the application to crash.

The contents of `onRender` are called every render, which ensures that the hooks work correctly.

_Note:_ Use `onRender` only when there is no other way.

```ts
import { onRender } from 'react-afc'
import { useEffect } from 'react'

//...//
  // Constructor
  useEffect(/*...*/) // Error !!!

  onRender(() => {
    useEffect(/*...*/) // Right
  })
//...//
```

## API

### afc/afcMemo

```ts
export function afc<P>(constructor: (props: P) => React.FC): React.FC<P>
export function afcMemo<P>(constructor: (props: P) => React.FC): React.MemoExoticComponent<React.FC<P>>
```

Accepts a _constructor function_, which should return the usual _component function_.

Returns the wrapped component. Not add an extra node to the virtual DOM.

```tsx
import { afc } from 'react-afc'

const Component = afc(props => {
  // constructor logic
  const render = (): ReactNode => <div>any content</div>
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

```ts
import { onDestroy } from 'react-afc'
// import { onDestroy } from 'react-afc/compatible'

//...//
  onDestroy(() => {
    document.removeEventListener(/*...*/)
  })
//...//
```

### onMount

```ts
export function onMount(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was mounted.

_The same as `useEffect(callback, [])`_

```ts
import { onMount } from 'react-afc'
// import { onMount } from 'react-afc/compatible'

//...//
  onMount(() => {
    document.addEventListener(/*...*/)
  })
//...//
```

### onDraw

```ts
export function onDraw(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was drawn.

_The same as `useLayoutEffect(() => {...}, [])`_

```ts
import { onDraw } from 'react-afc'
// import { onDraw } from 'react-afc/compatible'

//...//
  onDraw(() => {
    document.addEventListener(/*...*/)
  })
//...//
```

### memoized

```ts
export function memoized<T>(factory: () => T, depsGetter: () => any[]): () => T
```

Creates a memoized value getter

```tsx
import { memoized, reactive } from 'react-afc'
// import { memoized } from 'react-afc/compatible'

//...//
  const state = reactive({
    count: 0,
    mult: 0
  })
  const getResult = memoized(
    () => ({result: count * mult}),
    () => [state.count, state.mult]
  )

  const render = (): ReactNode => (
    <Component result={getResult()} />
  )
  return render
//...//
```

### createState

```ts
export function createState<S>(initial: S): StateReturns<S>
```

Accepts a state object.

Returns the object `{ state, set<Key> }`.

_Has a superficial comparison of objects_.

```ts
import { createState } from 'react-afc'
// import { createState } from 'react-afc/compatible'

//...//
  const { state, setName, setAge } = createState({
    name: 'Boris',
    age: 30
  })
  function onChange(): void {
    setAge(20) // State: { name: 'Boris', age: 20 }
  }
//...//
```

### reactive

```ts
export function reactive<S>(initial: S): S
```

Accepts a state object.

Returns a copy of the state object.  
When it is changed, the component is updated.

```ts
import { reactive } from 'react-afc'
// import { reactive } from 'react-afc/compatible'

//...//
  const state = reactive({
    count: 0
  })
  function onInput(value: number): void {
    state.count = value
  }
  function onButtonClick(): void {
    state.count++
  }
//...//
```

### ref

```ts
export function ref<T>(initial: T): { value: T }
```

Accepts the initial state of the reactive reference.

Returns a reactive reference.  
When the value of the link changes, the component will be updated.

```ts
import { ref } from 'react-afc'
// import { ref } from 'react-afc/compatible'

//...//
  const count = ref(0)
  const text = ref<string>(null)
  function onChange(): void {
    count.value++
    text.valie = 'example'
  }
//...//
```

### onRender

```ts
export function onRender(callback: () => void): void
```

Accepts a function without arguments.

Calls it immediately and before each render.

```ts
import { onRender } from 'react-afc'
// import { onRender } from 'react-afc/compatible'

//...//
  onRender(() => {
    useEffect(/*...*/)
    anyCommonHook()
  })
//...//
```

### handleContext

```ts
export function handleContext<T>(context: React.Context<T>): () => T
```

Accepts a context object.

Subscribes to context changes and returns `contextGetter`.

```ts
import { handleContext } from 'react-afc'
// import { handleContext } from 'react-afc/compatible'

import { NameContext } from './NameContext'

//...//
  const getContext = handleContext(NameContext)
  function greet(): string {
    const name = getContext()
    return `Hi, ${name}!`
  }
//...//
```

### useRedux

```ts
export function useRedux<T>(config: T): {
    [key in keyof T]: ReturnType<T[key]>
}
```

Accepts a config object of the form `{ key: selector }`.

Subscribes to the change of the store and returns an object of the form `{ key: value_from_selector }`.

```ts
import { useRedux } from 'react-afc'
// import { useRedux } from 'react-afc/compatible'

import { selectName, selectAge } from './personSlice'
import type { RootState } from './state'

//...//
  const store = useRedux({
    name: selectName,
    age: selectAge,
    count: (state: RootState) => state.count.value
  })
  function func(): void {
    const { name, age, count } = store
  }
//...//
```

### getDispatch

```ts
export function getDispatch<T>(): T
```

Doesn't accept anything.

Returns **redux dispatch**.

```ts
import { getDispatch } from 'react-afc'
// import { getDispatch } from 'react-afc/compatible'

import { changeName, changeAge } from './personSlice'
import type { AppDispatch } from './state'

//...//
  const dispatch = getDispatch<AppDispatch>()

  function onChangeName(value: string): void {
    dispatch(changeName(value))
  }
  function onChangeAge(value: number): void {
    dispatch(changeAge(value))
  }
//...//
```

### useActions

```ts
export function useActions<T>(actions: T): T
```

Accepts a redux actions

Returns wrapped actions. They can be used without dispatcher.

```ts
import { useActions } from 'react-afc'
// import { useActions } from 'react-afc/compatible'

import { actions } from './store'

//...//
  const {changeCount} = useActions(actions)
  function setCountToFive(): void {
    changeCount(5)
  }
//...//
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

```ts
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

```tsx
import { afc } from 'react-afc'
import { onceCreated, onMount } from 'react-afc/compatible'

function withHardCalc(): void {
  const bigValue = onceCreated(() => {/* calculations */})
  
  onMount(() => {
    console.log(bigValue)
  })
}

const AFCComponent = afc(() => {
  withHardCalc()
  return () => <p>content</p>
})

const CommonComponent = () => {
  // It will work the same way as in the afc component.
  // Will not cause errors.
  withHardCalc()
  return <p>content</p>
}
```
