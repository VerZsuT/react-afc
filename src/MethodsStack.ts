import type { Stack } from './types'

export default class MethodsStack {
    private stack: Stack = [{
        createState() { throw new Error('Попытка вызывать createState вне конструктора') },
        inRender() { throw new Error('Попытка вызывать inRender вне конструктора') },
        handleContext() { throw new Error('Попытка вызывать handleContext вне конструктора') },
        getDispatcher() { throw new Error('Попытка вызывать getDispatcher вне конструктора') },
        useRedux() { throw new Error('Попытка вызывать useRedux вне конструктора') },
        afterUnmount() { throw new Error('Попытка вызывать afterUnmount вне конструктора') }
    }]

    public push(item: Stack[number]) {
        this.stack.push(item)
    }

    public pop() {
        return this.stack.pop()
    }

    get last() {
        return this.stack[this.stack.length - 1]
    }
}
