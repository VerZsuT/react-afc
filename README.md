# React Advanced Function Component

Позволяет использовать классовые преимущества в функциональных компонентах
без дополнительных надстроек.

Не является универсальным инструментом "для всего и вся", и не является заменой стандартных компонентов. Либа лишь позволяет упростить оптимизацию.

## Установка

```npm
npm i react-afc
```

## Когда использовать

Когда требуется оптимизировать компонент путём уменьшения перерисовки дочерних компонентов.

## Зачем

Чтобы не писать лишние `useMemo`, `useCallback` и `useRef`.

## Что даёт

Позволяет уменьшить кол-во вызовов хуков (что влияет как на читаемость, так и на оптимизацию), а также не беспокоиться о массиве зависимостей.

## Пример

_Все доп. методы работают только в "конструкторе". Пояснения см. ниже._

```tsx
import advancedComponent, { createState, inRender } from 'react-afc'

interface Props {
    exampleProp: number
}

export default advancedComponent<Props>(props => {
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

## Структура компонента

```ts
import afc from 'react-afc'

const Component = afc(props => {
    // Тело "конструктора".
    // Вызывается перед первым рендером.
    // Хуки только в inRender.

    return () => {
        // render-функция, как в обычном компоненте.
        // Вызывается каждый рендер.
        // Спец. методы запрещены.

        return <JSX />
    }
})
```

## Создание состояния

Для работы с состоянием импортируем `createState`

```ts
import { createState } from 'react-afc'

...
    const [state, setState] = createState({
        author: 'VerZsuT'
        // key: value
    })
...
```

`setState` работает аналогично классовому `this.setState`

Для работы с `Redux` используем `useRedux` и `getDispatcher`

```ts
import { useRedux, select } from 'react-afc'
import type { Store, AppDispatch } from './store'
import { addCount } from './countSlice'

...
    const reduxState = useRedux({
        count: (store: Store) => store.count.value,
        // key: selector
    })
    const dispatch = getDispatcher<AppDispatch>()

    function onChange(value: number) {
        dispatch(addCount(value))
    }
...
```

## Работа с контекстом

Для использования контекста импортируем `handleContext`.

_Возвращает `геттер` контекста, а не сам контекст._

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

## Использование обычных хуков в теле "конструктора"

```ts
import { inRender } from 'react-afc'

...
    let exampleVar: string;
    inRender(() => {
        exampleVar = commonHook()
    })
...
```

`inRender` вызывается сразу и перед каждым рендером (чтобы не сломать хуки)

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

В данном примере вывод будет:

```text
Constructor start
inRender
After inRender
```

И перед каждым следующим рендером будет выведено в консоль

```text
inRender
```

## Как нельзя делать

Распаковка при объявлении сломает обновление пропсов: `name` и `age` будут одни и те же каждый рендер

`props` - `Proxy` над входящими в компонент пропсами.

```ts
import advanced from 'react-afc'

interface Props {
    name: string
    age: number
}

// Ошибка !!!
const Component = advanced<Props>(({ name, age })) => {...}
```

Распаковка `state`, `props` или `reduxState` напрямую в теле конструктора 'заморозит' эти переменные.

`state` - `Proxy` над состоянием

`name`, `age` и `surname` не будут меняться между рендерами.

_Распаковка в **render-функции** или обработчиках не имеет такой проблемы_

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
    const { name, age } = state // Ошибка, заморожены !!!
    const { count } = reduxState
    const { surname } = props

    function onClick() {
        const { name, age } = state // Правильно, всегда актуальные
        const { count } = reduxState
        const { surname } = props
    }
...
```

Использовать обычные хуки в конструкторе без обёртки `inRender` запрещено.

Так как "конструктор" вызывается один раз, то вызов обычных хуков в нём не будет повторяться в рендере, что приведёт к поломке работы хуков и падению приложения.

Содержимое `inRender` вызывается каждый рендер, что обеспечивает правильную работу хуков.

_Примечание:_ Ипользуйте `inRender` лишь тогда, когда нет другого варианта.

```ts
import { inRender, createState } from 'react-afc'
import { useEffect } from 'react'

...
    const [state, setState] = createState({...})

    useEffect(...) // Ошибка !!!

    inRender(() => {
        useEffect(...) // Правильно
    })
...
```

## Справка по API

### default import

```ts
export default advancedComponent<P>((props: P) => React.FC): React.FC<P>
```

Принимает _функцию-конструктор_, которая должна вернуть обычную _функцию-компонент_.

Возвращает обёрнутый компонент. Не является `HOK`.

```ts
import advancedComponent from 'react-afc'

const Component = advancedComponent(props => {
    ...
    return () => ReactNode
})
```

### afterUnmount

```ts
export function afterUnmount(callback: () => void): void
```

Принимает функцию без аргументов.

Вызывает её когда компонент был демонтирован.

_То же самое что и `useEffect(() => ..., [])`_

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

Принимает объект состояния.

Возвращает массив `[state, stateSetter]`.

_`state` = `Proxy<originalState>`_

`stateSetter` принимает частичный или полный объект нового состояния. Объединяет старый и новый объект (аналогично классовому `this.setState`)

```ts
import { createState } from 'react-afc'

...
    const [state, setState] = createState({
        name: 'Boris',
        age: 30
    })

    function onChange() {
        setState({ age: 20 }) // State = { name: 'Boris', age: 20 }
    }
...
```

### inRender

```ts
export function inRender(callback: () => void): void
```

Принимает функцию без аргументов.

Вызывает её сразу и перед каждым рендером.

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

Принимает объект контекста.

Подписывается на изменения контекста и возвращает `contextGetter`.

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

Принимает конфиг-объект вида `{ ключ: селектор }`.

Подписывается на изменение стора и возвращает объект вида `{ ключ: значение_по_селектору }`.

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

Ничего не принимает.

Возвращает `redux-dispatch`.

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
