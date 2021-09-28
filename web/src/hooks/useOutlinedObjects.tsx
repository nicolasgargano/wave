import React, {useCallback, useContext, useRef} from "react"
import {Object3D} from "three"

// TODO can the types be simplified?
export const outlinedObjectsContext = React.createContext<React.Dispatch<React.SetStateAction<React.MutableRefObject<Object3D>[]>>>(() => [])

export const useOutlinedObjects = () => {
    const ref = useRef<Object3D>()
    const setOutlined = useContext(outlinedObjectsContext)

    const onPointerOver = useCallback(() => {
        if (ref.current) {
            const r = ref as unknown as React.MutableRefObject<Object3D>
            setOutlined((state => [...state, r]))
        }
    }, [])

    const onPointerOut = useCallback(() => {
        setOutlined(state => state.filter(mesh => mesh !== ref))
    }, [])
    return { ref, onPointerOver, onPointerOut }
}