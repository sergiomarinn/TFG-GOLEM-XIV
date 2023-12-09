import { Sidebar } from './sidebar'



export const Main = () => {
    return (
        <div className='flex bg-white'>
            <Sidebar />
            <div className="flex-1 p-4">
                <h1 className="text-2xl font-semibold ">Home Page</h1>
            </div>
        </div>
    );
};