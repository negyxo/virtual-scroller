import {
    Component,
    Input,
    ContentChild,
    ViewChild,
    ElementRef,
    TemplateRef,
    AfterViewInit,
    OnDestroy,
    DoCheck,
    HostListener
} from '@angular/core';

import { asEnumerable } from 'linq-es2015';

@Component({
    selector: "virtualScroll",
    templateUrl: "virtual.scroll.component.html",
    styleUrls: ["virtual.scroll.component.scss"]
})
export class VirtualScrollComponent implements AfterViewInit, OnDestroy, DoCheck {

    @ContentChild(TemplateRef)
    public itemTemplate: TemplateRef<any>;

    @Input()
    public items: any[]

    public topPadding: number = 0;

    public spacerHeight: number = 0;

    public range: any[];

    @ViewChild("virtualContainer")
    private virtualContainerElementRef: ElementRef;

    @ViewChild("container")
    private containerElementRef: ElementRef;

    private get virtualContainerElement(): Element {
        return this.virtualContainerElementRef.nativeElement as Element;
    }

    private get containerElement(): Element {
        return this.containerElementRef.nativeElement as Element;
    }

    private get firstChildHeight(): number {
        return this.virtualContainerElement.children[0] != undefined ?
            this.virtualContainerElement.children[0].clientHeight :
            0;
    }

    @HostListener("window:resize")
    onWindowScroll() {
        this.refresh();
    }

    ngAfterViewInit(): void {
        this.containerElement.addEventListener("scroll", this.scrollHandler);
    }

    ngDoCheck(): void {
        this.refresh();
    }

    ngOnDestroy(): void {
        this.containerElement.removeEventListener("scroll", this.scrollHandler);
    }

    private scrollHandler = (event:any) => {
        this.refresh();
    }

    private refresh(): void
    {
        if (this.containerElementRef == undefined) return;
        
        let visibleItemsCount = Math.ceil(this.containerElement.clientHeight / this.firstChildHeight) + 1;
        let aboveItemsCount = Math.floor(this.containerElement.scrollTop / this.firstChildHeight);
        let startIndex = Math.min(aboveItemsCount, Math.abs(this.items.length - visibleItemsCount));
        let yOffset = this.containerElement.scrollTop - this.firstChildHeight * startIndex;

        this.spacerHeight = this.items.length * this.firstChildHeight;
        this.topPadding = this.containerElement.scrollTop - yOffset;
        this.range = asEnumerable(this.items)
            .Skip(startIndex)
            .Take(visibleItemsCount)
            .ToArray();
    }
}