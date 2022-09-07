import type {Data} from './types'

export const data = {
    current: {
        set beforeRender(_) {
            throw new Error('Attempt to outside call react-afc method')
        },
        get beforeRender(): () => void {
            throw new Error('Attempt to outside call react-afc method')
        },
        events: {},
        props: {},
        render: null
    } as Data<any>
}

export function addToRender(callback: () => void): void {
    const prev = data.current.beforeRender
    data.current.beforeRender = () => {
        prev()
        callback()
    }
}

export function addToRenderAndCall<T = undefined>(callback: () => T): T {
    addToRender(callback)
    return callback()
}

