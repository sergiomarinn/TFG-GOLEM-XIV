import { useState } from "react";
import flecha from "../assets/control.png"
import ubL from "../assets/ub_logo.png"


export const Sidebar = () => {
    const [open, setOpen] = useState(true);
    const Menus = [
        { title: "Inici", src: ubL },
    ];

    return (
        <div className="flex bg-slate-800">
            <div className="w-1/5 p-4">
                <div
                    className={` ${open ? "w-72" : "w-20 "
                        } bg-dark-purple h-screen p-5  pt-8 relative duration-500`}
                >
                    <img
                        src={flecha}
                        className={`absolute cursor-pointer -right-7 top-9 w-7 border-purple-800 border-2 rounded-full  ${!open && "rotate-180"}`}
                        onClick={() => setOpen(!open)
                        }
                    />
                    <div className="flex gap-x-4 items-center">
                        <img
                            src={ubL}
                        />
                        <h1
                            className={`text-white origin-left font-medium text-xl duration-200 ${!open && "scale-0"}`}
                        >
                            Corrector UB
                        </h1>
                    </div>
                    <ul className="pt-6">
                        {Menus.map((Menu, index) => (
                            <li
                                key={index}
                                className={`flex  rounded-md p-2 cursor-pointer hover:bg-light-white text-gray-300 text-sm items-center gap-x-4 
              ${Menu.gap ? "mt-9" : "mt-2"} ${index === 0 && "bg-light-white"
                                    } `}
                            >
                                <img src={Menu.src} />
                                <span className={`${!open && "hidden"} origin-left duration-200`}>
                                    {Menu.title}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
