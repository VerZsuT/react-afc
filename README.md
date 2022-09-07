# React Advanced Function Component

Allows you to use class advantages in functional components
without additional add-ons.

Allows you to simplify optimization.

# Table of contents
- [Installation](#installation)
- [When to use](#when-to-use)
- [Why](#why)
- [What gives](#what-gives)
- [Performance](#performance)
- [Example](#example)
- [Component structure](#component-structure)
- [State management](#state-management)
- [Working with context](#working-with-context)
- [Regular hooks in constructor](#using-regular-hooks-in-the-body-of-the-constructor)
- [Common errors](#common-errors)

**API**
- [afc](#afcafcmemo)
- [afcMemo](#afcafcmemo)
- [afterUnmount](#afterunmount)
- [afterMount](#aftermount)
- [afterDraw](#afterdraw)
- [memoized](#memoized)
- [createState](#createstate)
- [handleContext](#handlecontext)
- [useRedux](#useredux)
- [useActions](#useactions)
- [getDispatcher](#getdispatcher)
- [inRender](#inrender)

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

- `createState` adds one `useState` call
- `useRedux` adds `useSelector` calls depending on the passed object (one key - one hook call)
- `afterUnmount`/`afterMount`/`afterDraw` adds one `useEffect` call with the passed callback
- `inRender` adds a call the passed callback (performance directly depends on the actions in it)
- `handleContext` adds one `useContext` call
- `getDispatcher`/`useActions` adds one `useDispatch` call
- `memoized` adds one `useMemo` call

_Note:_ `createState`/`getDispatcher`/`useActions`/`afterUnmount`/`afterMount`/`afterDraw`
adds one hook call regardless of the number of its calls

Each of the methods can be called an **unlimited** number of times, but only within the constructor
and in functions called from it.

## Example

_See the description below_.

```tsx
import type {ChangeEvent} from 'react'
import {createState, inRender, afcMemo, useActions, useRedux} from 'react-afc'
import {selectName, actions} from './store'

interface Props {
    exampleProp: number
}

export default afcMemo<Props>(props => {
    const { changeName } = useActions(actions)
    
    const reduxState = useRedux({
        name: selectName
    })
    const { state, setMultiplier, setNumber } = createState({
        multiplier: "2",
        number: "5"
    })

    function onChangeMult(e: ChangeEvent<HTMLInputElement>) {
        setMultiplier(e.currentTarget.value)
    }

    function onChangeNumber(e: ChangeEvent<HTMLInputElement>) {
        setNumber(e.currentTarget.value)
    }
    
    function onChangeName(e: ChangeEvent<HTMLInputElement>) {
        changeName(e.currentTarget.value)
    }

    function calcValue() {
        return +state.multiplier * +state.number
    }

    return () => {
        const { multiplier, number } = state
        const { name } = reduxState

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
})
```

## Component structure

```tsx
import {afc} from 'react-afc'

const Component = afc(props => {
    // The body of the "constructor".
    // Is called once (before the first render).
    // Hooks only in inRender.

    return () => {
        // render-function, as in a regular component.
        // Every render is called.

        return <div>content</div>
    }
})
```

## State management

To work with the state, import `createState`

```ts
import {createState} from 'react-afc'

//...//
    const { state, setAuthor, setName /* set<Key> */ } = createState({
        author: 'VerZsuT',
        name: 'react-afc'
        // key: value
    })
//...//
```

To work with **Redux** use `useRedux` and `getDispatcher`/`useActions`

```ts
import {useRedux, getDispatcher, useActions} from 'react-afc'
import type {Store, AppDispatch} from './store'
import {actions} from './store'
import {changeCount, selectCount} from './countSlice'

//...//
    const reduxState = useRedux({
        name: (store: Store) => store.name.current,
        count: selectCount
        // key: selector
    })
    function greet() {
        const { name } = reduxState
        return `Hi, ${name}!`
    }

    const dispatch = getDispatcher<AppDispatch>()
    function onChange(value: number) {
        dispatch(changeCount(value))
    }
    
    // Alternative
    const { delCount } = useActions(actions)
    function onDelCount() {
        delCount()
    }
//...//
```

## Working with Context

To use the context, import the `handleContext`.

_Returns the context **getter**, not the context itself_.

```ts
import {handleContext} from 'react-afc'
import CountContext from './CountContext'

//...//
    const getCount = handleContext(CountContext)

    function calculate() {
        return getCount() * 5
    }
//...//
```

## Using regular hooks in the body of the "constructor"

```ts
import {inRender} from 'react-afc'

//...//
    let exampleVar: string;
    inRender(() => {
        exampleVar = commonHook()
    })
//...//
```

`inRender` is called immediately and before each render (so as not to break hooks)

```ts
import {inRender} from 'react-afc'

//...//
    console.log('Constructor start')
    inRender(() => {
        console.log('inRender')
    })
    console.log('After inRender')
//...//
```

In this example, the console output will be:

```text
Constructor start
inRender
After inRender
```

And before each next render it will be output to the console

```text
inRender
```

## Common errors

Unpacking at the declaration will break the updating of the props: `name` and `age` will be the same every render

```ts
import {afc} from 'react-afc'

interface Props {
    name: string
    age: number
}

                              // Error !!!
const Component = afc<Props>(({ name, age }) => { /*...*/ })
```

Unpacking `state`, `props` or `reduxState` directly in the constructor body will **freeze** these variables:
`name`, `age` and `surname` will not change between renders.

_The exclusion is the case when the received fields do not change during the life of the component_  
_Unpacking in **render function** or handlers does not have such a problem_

```ts
import {createState, useRedux} from 'react-afc'
import type {RootState} from './state'

//...//
    const { state, setName, setAge } = createState({
        name: 'Aleksandr',
        age: 20
    })
    const reduxState = useRedux({
        count: (state: RootState) => state.count.value
    })
    const { name, age } = state // Error, freeze !!!
    const { count } = reduxState
    const { surname } = props

    function onClick() {
        const { name, age } = state // Right, always relevant
        const { count } = reduxState
        const { surname } = props
    }
//...//
```

It is forbidden to use regular hooks in the constructor without the `inRender` wrapper.

Since the "constructor" is called once, the call of the usual hooks in it will not be repeated in the render, which will cause the hooks to break and the application to crash.

The contents of `inRender` are called every render, which ensures that the hooks work correctly.

_Note:_ Use `inRender` only when there is no other way.

```ts
import {inRender} from 'react-afc'
import {useEffect} from 'react'

//...//
    // Constructor

    useEffect(/*...*/) // Error !!!

    inRender(() => {
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
import {afc} from 'react-afc'

const Component = afc(props => {
    // constructor logic
    return () => <div>any content</div>
})
```

### afterUnmount

```ts
export function afterUnmount(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was unmounted.

_The same as `useEffect(() => callback, [])`_

```ts
import {afterUnmount} from 'react-afc'

//...//
    afterUnmount(() => {
        document.removeEventListener(/*...*/)
    })
//...//
```

### afterMount

```ts
export function afterMount(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was mounted.

_The same as `useEffect(callback, [])`_

```ts
import {afterMount} from 'react-afc'

//...//
    afterMount(() => {
        document.addEventListener(/*...*/)
    })
//...//
```

### afterDraw

```ts
export function afterDraw(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was drawn.

_The same as `useLayoutEffect(() => {...}, [])`_

```ts
import {afterDraw} from 'react-afc'

//...//
    afterDraw(() => {
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
import {memoized, createState} from 'react-afc'

//...//
    const { state, setCount, setMult } = createState({
        count: 0,
        mult: 0
    })
    const getResult = memoized(
        () => ({ result: count * mult }),
        () => [state.count, state.mult]
    )

    return () => (
        <Component result={getResult()} />
    )
//...//
```

### createState

```ts
export function createState<S>(initial: S): StateReturns<S>
```

Accepts a status object.

Returns the object `{ state, set<Key> }`.

_Has a superficial comparison of objects_.

```ts
import {createState} from 'react-afc'

//...//
    const { state, setName, setAge } = createState({
        name: 'Boris',
        age: 30
    })

    function onChange() {
        setAge(20) // State: { name: 'Boris', age: 20 }
    }
//...//
```

### inRender

```ts
export function inRender(callback: () => void): void
```

Accepts a function without arguments.

Calls it immediately and before each render.

```ts
import {inRender} from 'react-afc'

//...//
    inRender(() => {
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
import {handleContext} from 'react-afc'
import {NameContext} from './NameContext'

//...//
    const getContext = handleContext(NameContext)

    function greet() {
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
import {useRedux} from 'react-afc'
import {selectName, selectAge} from './personSlice'
import type {RootState} from './state'

//...//
    const reduxState = useRedux({
        name: selectName,
        age: selectAge,
        count: (state: RootState) => state.count.value
    })

    function func() {
        const { name, age, count } = reduxState
    }
//...//
```

### getDispatcher

```ts
export function getDispatcher<T extends Dispatch<AnyAction>>(): T
```

Doesn't accept anything.

Returns **redux dispatch**.

```ts
import {getDispatcher} from 'react-afc'
import {changeName, changeAge} from './personSlice'
import type {AppDispatch} from './state'

//...//
    const dispatch = getDispatcher<AppDispatch>()

    function onChangeName(value: string) {
        dispatch(changeName(value))
    }

    function onChangeAge(value: number) {
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
import {useActions} from 'react-afc'
import {actions} from './store'

//...//
    const { changeCount } = useActions(actions)
    function setCountToFive() {
        changeCount(5)
    }
//...//
```

