import React, {useEffect} from "react";
import {AiOutlineSend} from "react-icons/ai";
import { useAccount } from 'wagmi';

interface DebouncedInputProps {
    value: string | number;
    onChange: (value: string | number) => void;
    debounce?: number;
}
    /**
     *
     * @param param0
     * Debounced Input, should handle debouncing in order to avoid
     * too many state changes
     */

const DebouncedInput = ({
        value: initialValue,
        onChange,
        debounce = 500,
        ...props
        }: DebouncedInputProps &
        Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) => {
    
    const [value, setValue] = React.useState(initialValue);
    const {isConnected}=useAccount();

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value);
        }, debounce);

        return () => clearTimeout(timeout);
    }, [value]);

    return (
        <>
            <div className="relative w-full ml-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <AiOutlineSend className="mx-1 text-prime2" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    className={`w-full block p-1.5 pl-10 text-sm text-prime2 border 
                            border-prime2 rounded-lg bg-black/20
                                focus:ring-1 focus:ring-prime1 focus:border-prime1
                                ${isConnected? "":"placeholder:text-alertred1 font-semibold"}
                                `}
                    maxLength={250}
                    id="message-box"

                    {...props}
                    onChange={(e) => setValue(e.target.value)}
                    value={value}
                    disabled={!isConnected}
                    placeholder={isConnected?"Type a message... (max 250words)":"Pls connect wallet to chat."}
                />
            </div>
        </>
    );
};


export const NormalInput = ({ value: initialValue, onChange }) => {
    const [value, setValue] = React.useState(initialValue);
    const {isConnected}=useAccount();
    return (
        <>
            <div className="relative w-full ml-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <AiOutlineSend className="mx-1 text-prime2" aria-hidden="true" />
                </div>
                <input type="text" 
                    className={`w-full block p-1.5 pl-10 text-sm text-prime2 border 
                            border-prime2 rounded-lg bg-black/20
                                focus:ring-1 focus:ring-prime1 focus:border-prime1
                                ${isConnected? "":"placeholder:text-alertred1 font-semibold"}
                                `}
                    maxLength={250}
                    id="message-box"
                    value={initialValue}
                    onChange={onChange}
                    disabled={!isConnected}
                    placeholder={isConnected?"Type a message... (max 250words)":"Pls connect wallet to chat."}
                />
            </div>
        </>
    )
}


export default DebouncedInput;