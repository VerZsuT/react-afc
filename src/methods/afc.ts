import type { FC } from 'react'
import { useRef } from 'react'

import {setData, resetData, setConstructing} from '../lib'
import type { Constructor, Data } from '../types'

/**
 * Returns a component with constructor functionality
 */
export function afc<P>(constructor: Constructor<P>): FC<P> {
  return (props: P) => {
    const ref = useRef<Data<P>>()
    let refData = ref.current

    if (refData) {
      const dataProps = refData.props
      for (const key in dataProps) {
        if (key in props) continue
        delete dataProps[key]
      }
      for (const key in props)
        dataProps[key] = props[key]

      refData.beforeRender()
      return refData.render() as JSX.Element
    }

    refData = ref.current = {
      beforeRender: () => null,
      events: {},
      render: () => null,
      props: {...props}
    }

    setConstructing(true)
    setData(refData)
    refData.render = constructor(refData.props)
    resetData()
    setConstructing(false)
    return refData.render() as JSX.Element
  }
}
