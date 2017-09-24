import {
    Component,
    Input,
    ContentChild,
    ViewChild,
    ElementRef,
    TemplateRef,
    AfterViewInit,
    OnDestroy,
    OnInit,
    AfterContentInit,
    DoCheck,
    HostListener
} from '@angular/core';

import ItemWrapper from "./virtual.scroll.item.wrapper";

@Component({
    selector: "virtualScroll",
    templateUrl: "virtual.scroll.component.html",
    styleUrls: ["virtual.scroll.component.scss"],
})
export class VirtualScrollComponent implements AfterViewInit, OnDestroy, DoCheck, OnInit {
    ngOnInit(): void {
        console.log("OnInit - VirtualScroll items.length " + this.items.length);
    }

    constructor()
    {
        console.log("Constructor - VirtualScroll items.length " + this.items.length);
    }

    @ContentChild(TemplateRef)
    public itemTemplate: TemplateRef<any>;

    @Input()
    public items: any[] = [];
    
    public topPadding: number = 0;

    public spacerHeight: number = 0;

    public range: ItemWrapper[] = [];

    private _previousItemsCount = 0;

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

    @HostListener("window:resize")
    public onWindowResize() {
        this.refresh();
    }

    public ngAfterViewInit() {
        this.containerElement.addEventListener("scroll", this.scrollHandler);
    }

    public ngOnDestroy() {
        this.containerElement.removeEventListener("scroll", this.scrollHandler);
    }

    public ngDoCheck() {
        // optimize checking, we don't have to refresh anything
        // if items length is the same (nothing is added or removed)
        // otherwise, we only need to react on scroll and size change
        if (this.items.length == this._previousItemsCount) return;

        if (this.range.length == 0 && this.items.length > 0) {

            // because we don't show all items in a viewport
            // (that is the purpose of this virtual scroller - not to
            // write all DOM elements), we show only small subset that is
            // visible on the screen, but in order to find how many items
            // there should be on the screen (viewport), we need to somehow
            // draw elements on the screen and then to calculate how many of 
            // them should be drawn on the screen, and this is a catch 22,
            // we cannot write elements to screen until we know how many
            // do we need them (because it depends on item's height) and
            // we cannot calculate how many do we need until something is
            // written to DOM and rendered. So, to overcome this we write
            // one element when there's nothing and then we trigger
            // calculation based on that one element after what refresh
            // function will set once again the range array to actual
            // viewport size and trigger the rendering (well, that is in
            // the case that there is more than one element :))
            this.range = [new ItemWrapper(this.items[0], 0)];
            setTimeout(() => this.refresh());
        }
        else {
            this._previousItemsCount = this.items.length;
            this.refresh();
        }
    }

    private scrollHandler = (event:any) => {
        this.refresh();
    }

    private refresh()
    {
        if (this.virtualContainerElement.children[0] == undefined) return;

        const firstChildHeight = this.virtualContainerElement.children[0].clientHeight;
        const visibleItemsCount = Math.ceil(this.containerElement.clientHeight / firstChildHeight) + 1;
        const aboveItemsCount = Math.floor(this.containerElement.scrollTop / firstChildHeight);
        const startIndex = Math.min(aboveItemsCount, Math.abs(this.items.length - visibleItemsCount)) || 0;
        const yOffset = this.containerElement.scrollTop - firstChildHeight * startIndex;

        this.spacerHeight = this.items.length * firstChildHeight;
        this.topPadding = this.containerElement.scrollTop - yOffset;

        // we cache range items, so we can inspect whether some items 
        // should remain in the array. We do this because angular is
        // tracking references to objects and if reference is the same,
        // it won't be refreshed by angular UI engine, which will only
        // improve performance, which is highly desirable here because
        // this is virtualized scroll dedicated for large collections
        const cached = new Map(this.range.map(i => [i.item, i]) as [any, any][]);
        
        this.range  = this.items
            .slice(startIndex, startIndex + visibleItemsCount)
            .map((p, i) => cached .get(p) || new ItemWrapper(p, i! + startIndex));
    }
}