export const addressShortener = (address: string) => {
    return address?.length > 40 ? 
    address.slice(0, 5) + "..." + address.slice(-4) : (address??"")
}