import { Html } from "@react-three/drei"

export const LinksOverlay = () => (
  <Html as="div" fullscreen className="grid place-items-end">
    <div className="flex flex-col space-y-1 pointer-events-auto items-end p-2 text-xs leading-normal text-gray-500 select-none">
      <a
        className="hover:underline hover:text-gray-400 font-bold"
        href="https://github.com/nicolasgargano/wave"
      >
        nicolasgargano/wave
      </a>
    </div>
  </Html>
)
