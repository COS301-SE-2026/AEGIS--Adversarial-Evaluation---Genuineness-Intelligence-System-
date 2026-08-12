/*  
    providers sit at the top of the code base and act as a cache.
    it stores the data fetched from api requests, if one of the components request data it takes it from the cache directly.
    in the background the provider will make requests to specific api endpoints to check if data has changed, if so the cache gets updated, increasing loading speeds.
*/

"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface QueryProviderProps {
    children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        
        () => new QueryClient({
            
            defaultOptions: {
                queries: {
                    staleTime: 10_000, // this marks the fetched data as "old info" after 10s
                    refetchOnWindowFocus: true, // this forces a new request to be made once the user comes back in the web tab
                    refetchOnReconnect: true, // requests get made each time the user makes a new internet connection
                    retry: 2, // make two addition requests if the 1st query fails
                }
            }

        })
    
    );

    return(
        <QueryClientProvider
            client={queryClient}
        >
            {children}
        </QueryClientProvider>
    )
}
