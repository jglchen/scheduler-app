import Head from 'next/head';

export default function Layout({ children}: {children: JSX.Element}) {
    return (
        <>
           <Head>
             <title>Appointment Scheduler Application</title>
             <link rel="icon" href="/favicon.ico" />
           </Head>
           <main>
              {children}
           </main>   
        </>
    );
}


