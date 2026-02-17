"use client";

import { MenuItem } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images"; // Assuming this exists based on previous file reads

interface MenuGridProps {
    items: MenuItem[];
    onAddItem: (item: MenuItem) => void;
}

export function MenuGrid({ items, onAddItem }: MenuGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 pb-20">
            {items.map((item) => {
                const itemImage = PlaceHolderImages.find((img) => img.id === item.image);
                return (
                    <Card
                        key={item.id}
                        className="cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all duration-200 active:scale-95 flex flex-col h-full overflow-hidden group"
                        onClick={() => onAddItem(item)}
                    >
                        <div className="relative h-32 w-full bg-muted overflow-hidden">
                            {itemImage ? (
                                <Image
                                    src={itemImage.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No Image
                                </div>
                            )}
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                        </div>
                        <CardHeader className="p-3 pb-0">
                            <CardTitle className="text-sm font-medium line-clamp-2 leading-tight">
                                {item.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 flex-grow">
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                        </CardContent>
                        <CardFooter className="p-3 pt-0 flex justify-between items-center mt-auto">
                            <span className="font-bold text-sm">₹{item.price}</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
