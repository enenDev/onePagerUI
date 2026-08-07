import {Outlet} from 'react-router-dom';

const MainLayout = () => {
    return (
        <>
        <header>Header</header>
        <main>
            <Outlet/>
        </main>
        <footer>
        </footer>
        </>
    )
}

export default MainLayout;