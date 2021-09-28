import React from "react"

export const LinksOverlay = () =>
    <div className={"flex absolute inset-0 w-screen h-screen pointer-events-none text-white justify-end items-end select-none"}>
        <div className={"flex flex-col space-y-1 pointer-events-auto items-end p-2 text-xs leading-normal text-gray-500"}>
            <a className={"hover:underline hover:text-gray-400 font-bold"}
                href={"https://github.com/nicolasgargano/wave"}>
                nicolasgargano/wave
            </a>
            <a className={"hover:underline hover:text-gray-400"}
                href={"https://twitter.com/fpbomber"}>
                @fpbomber
            </a>
        </div>
    </div>