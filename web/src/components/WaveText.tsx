import React, {FC} from "react"
import {GradientTexture, Text} from "@react-three/drei"
import {MeshProps} from "@react-three/fiber"

import interFontUrl from "../../assets/Inter-Bold.woff"

type WaveTextProps = MeshProps & {
    colors: [string, string]
}

export const WaveText: FC<WaveTextProps> = ({colors, ...props}) => {
    return (
        <Text font={interFontUrl} fontSize={3} letterSpacing={-0.06} {...props}>
            wave
            <meshBasicMaterial toneMapped={false}>
                <GradientTexture
                    stops={[0, 1]}
                    colors={colors} // Colors need to match the number of stops
                    size={1}
                />
            </meshBasicMaterial>
        </Text>
    )
}
