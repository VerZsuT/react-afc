# React Advanced Function Component

Позволяет использовать классовые преимущества в функциональных компонентах
без дополнительных надстроек.

Не является универсальным инструментом "для всего и вся", и не является заменой стандартных компонентов. Либа лишь позволяет упростить оптимизацию.

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
        number: "5",
        name: "Ghost"
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

Для работы с `Redux` используем `useRedux`, `select` и `getDispatcher`

```ts
import { useRedux, select } from 'react-afc'
import type { Store, AppDispatch } from './store'
import { addCount } from './countSlice'

...
    // Обязательно оборачиваем селектор в select
    const reduxState = useRedux({
        count: select((store: Store) => store.count.value),
        // key: select(<selector>)
    })
    const dispatch = getDispatcher<AppDispatch>()

    function onChange(value: number) {
        dispatch(addCount(value))
    }
...
```

## Работа с контекстом

Для использования контекста импортируем `handleContext`

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
