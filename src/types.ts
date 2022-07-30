export type FuncToInsert = () => void
export type RenderFunc = () => JSX.Element

export type Constructor<P> = (props: P) => RenderFunc

export interface Data<P> {
    beforeRender: () => void
    render: RenderFunc
    props: P
}

export type UseReduxConfig<T> = {
    [key: string]: (state: T) => any
}
