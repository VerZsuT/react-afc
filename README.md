# React Advanced Function Component

Allows you to use class advantages in functional components
without additional add-ons.

Allows you to simplify optimization.

## Installation

```npm
npm i react-afc
```

## When to use

When you need to optimize a component by reducing the rerender of child components.

## Why

In order not to write unnecessary `useMemo`, `useCallback` and `useRef`.

## What gives

Allows you to reduce the number of hook calls (which affects both readability and optimization), and also not to worry about an array of dependencies.

## Perfomance

The library is optimized as much as possible.

`afcMemo` returns the `memo`-component
`afc` returns a regular component

Each render uses one `useRef` hook, and the `prop` variable is also updated (which takes about 0.01ms).

Calling the following methods adds logic that is used during **each render**:

- `createState` adds one `useState` call
- `useRedux` add `useSelector` calls depending on the passed object (one key - one hook call)
- `afterUnmount` adds one `useEffect` call with the passed callback
- `inRender` adds a call the passed callback (performance directly depends on the actions in it)
- `handleContext` adds one `useContext` call
- `getDispatcher` adds one `useDispatch` call

Each of the methods can be called an **unlimited** number of times, but only within the constructor and in functions called from it.

## Example

_See the description below_.

```tsx
import { createState, inRender, afcMemo } from 'react-afc'

interface Props {
    exampleProp: number
}

export default afcMemo<Props>(props => {
    const [state, setState] = createState({
        multiplier: "2",
        number: "5"
    })

    function onChangeMult(value: string) {
        setState({ multiplier: value })
    }

    function onChangeNumber(value: string) {
        setState({ number: value })
    }

    function calcValue() {
        return +state.multiplier * +state.number
    }

    return () => {
        const { multiplier, number } = state;

        return (
            <div>
                <h1>Advanced function component</h1>
                <input value={multiplier} onChange={onChangeMult} />
                <input value={number} onChange={onChangeNumber} />
                <p>Calculated: {calcValue()}</p>
            </div>
        )
    }
})
```

## Component structure

```ts
import { afc } from 'react-afc'

const Component = afc(props => {
    // The body of the "constructor".
    // Is called before the first render.
    // Hooks only in inRender.

    return () => {
        // render-function, as in a regular component.
        // Every render is called.

        return <JSX />
    }
})
```

## Creating a State

To work with the state, import `createState`

```ts
import { createState } from 'react-afc'

...
    const [state, setState] = createState({
        author: 'VerZsuT'
        // key: value
    })
...
```

`setState` works similarly to the class `this.setState`

To work with **Redux** use `useRedux` and `getDispatcher`

```ts
import { useRedux } from 'react-afc'
import type { Store, AppDispatch } from './store'
import { addCount, selectCount } from './countSlice'

...
    const reduxState = useRedux({
        count: (store: Store) => store.count.value,
        // or count: selectCount
        // key: selector
    })
    const dispatch = getDispatcher<AppDispatch>()

    function onChange(value: number) {
        dispatch(addCount(value))
    }
...
```

## Working with Context

To use the context, import the `handleContext`.

_Returns the context **getter**, not the context itself_.

```ts
import { handleContext } from 'react-afc'
import CountContext from './CountContext'

...
    const getCount = handleContext(CountContext)

    function calculate() {
        return getCount() * 5
    }
...
```

## Using regular hooks in the body of the "constructor"

```ts
import { inRender } from 'react-afc'

...
    let exampleVar: string;
    inRender(() => {
        exampleVar = commonHook()
    })
...
```

`in Render` is called immediately and before each render (so as not to break hooks)

```ts
import { inRender } from 'react-afc'

...
    console.log('Constructor start')
    inRender(() => {
        console.log('inRender')
    })
    console.log('After inRender')
...
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

## Main errors

Unpacking at the declaration will break the updating of the props: `name` and `age` will be the same every render

```ts
import { afc } from 'react-afc'

interface Props {
    name: string
    age: number
}

// Error !!!
const Component = afc<Props>(({ name, age })) => {...}
```

Unpacking `state`, `props` or `reduxState` directly in the constructor body will **freeze** these variables:
`name`, `age` and `surname` will not change between renders.

_Unpacking in **render function** or handlers does not have such a problem_

```ts
import { createState, useRedux } from 'react-afc'
import type { RootState } from './state'

...
    const [state, setState] = createState({
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
...
```

It is forbidden to use regular hooks in the constructor without the `inRender` wrapper.

Since the "constructor" is called once, the call of the usual hooks in it will not be repeated in the render, which will cause the hooks to break and the application to crash.

The contents of `inRender` are called every render, which ensures that the hooks work correctly.

_Note:_ Use `inRender` only when there is no other way.

```ts
import { inRender, createState } from 'react-afc'
import { useEffect } from 'react'

...
    const [state, setState] = createState({...})

    useEffect(...) // Error !!!

    inRender(() => {
        useEffect(...) // Right
    })
...
```

## API

### afc/afcMemo

```ts
export default afc<P>((props: P) => React.FC): React.FC<P>
export default afcMemo<P>((props: P) => React.FC): React.MemoExoticComponent<React.FC<P>>
```

Accepts a _constructor function_, which should return the usual _component function_.

Returns the wrapped component. Not add a new node to the virtual DOM.

```ts
import { afc } from 'react-afc'

const Component = afc(props => {
    ...
    return () => ReactNode
})
```

### afterUnmount

```ts
export function afterUnmount(callback: () => void): void
```

Accepts a function without arguments.

Calls it when the component was unmounted.

_The same as `useEffect(() => () => ..., [])`_

```ts
import { afterUnmount } from 'react-afc'

...
    afterUnmount(() => {
        document.removeEventListener(...)
    })
...
```

### createState

```ts
export function createState<S>(initial: S): [S, (newState: Partial<S>) => void]
```

Accepts a status object.

Returns the array `[state, stateSetter]`.

The `stateSetter` accepts a partial or complete object of the new state. Combines old and new object (similar to class `this.setState`).

_Has a superficial comparison of objects_.

```ts
import { createState } from 'react-afc'

...
    const [state, setState] = createState({
        name: 'Boris',
        age: 30
    })

    function onChange() {
        setState({ age: 20 }) // State: { name: 'Boris', age: 20 }
    }
...
```

### inRender

```ts
export function inRender(callback: () => void): void
```

Accepts a function without arguments.

Calls it immediately and before each render.

```ts
import { inRender } from 'react-afc'

...
    inRender(() => {
        useEffect(...)
        anyCommonHook()
    })
...
```

### handleContext

```ts
export function handleContext<T>(context: React.Context<T>): () => T
```

Accepts a context object.

Subscribes to context changes and returns `contextGetter`.

```ts
import { handleContext } from 'react-afc'
import NameContext from './NameContext'

...
    const getContext = handleContext(NameContext)

    function greet() {
        const name = getContext()
        return `Hi, ${name}!`
    }
...
```

### useRedux

```ts
export function useRedux<T>(config: T): {
    [key in keyof T]: ReturnType<T[key]>
}
```

Accepts a config object of the form `{ key: selector }`.

Subscribes to the change of the store and returns an object of the form `{ key: value_to_the_selector }`.

```ts
import { useRedux } from 'react-afc'
import { selectName, selectAge } from './personSlice'
import type RootState from './state'

...
    const reduxState = useRedux({
        name: selectName,
        age: selectAge,
        count: (state: RootState) => state.count.value
    })

    function func() {
        const { name, age, count } = reduxState
    }
...
```

### getDispatcher

```ts
export function getDispatcher<T extends Dispatch<AnyAction>>(): T
```

Doesn't accept anything.

Returns **redux dispatch**.

```ts
import { getDispatcher } from 'react-afc'
import { changeName, changeAge } from './personSlice'
import type { AppDispatch } from './state'

...
    const dispatch = getDispatcher<AppDispatch>()

    function onChangeName(value: string) {
        dispatch(changeName(value))
    }

    function onChangeAge(value: number) {
        dispatch(changeAge(value))
    }
...
```
