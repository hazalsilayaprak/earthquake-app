import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import * as FileSaver from "file-saver";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";

import { MenuItem } from "primeng/api";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  @ViewChild("info", { static: true }) info: ElementRef;
  tableData: any[];
  features: any[];

  first = 0;
  rows = 10;

  searchText: string = "";

  cols: any[];
  exportColumns: any[];
  startDate: string = "";
  endDate: string = "";
  minDepth: number;
  maxDepth: number;
  minMagnitude: number;
  maxMagnitude: number;
  eventId: number;
  limit: number;
  map: Map;
  options: any[];
  magTypes: any[];
  selectedOption: any = null;
  selectedType: any = null;
  latestEarthquake: string = "";

  constructor() {
    this.options = [
      { name: "Select order option", code: null },
      { name: "Time ", code: "time" },
      { name: "Time Desc", code: "timedesc" },
      { name: "Magnitude ", code: "magnitude" },
      { name: "Magnitude Desc", code: "magnitudedesc" },
    ];
    this.magTypes = [
      { name: "Select magnitude type", code: null },
      { name: "ML", code: "ML" },
      {
        name: "Mw",
        code: "Mw",
      },
    ];
  }

  ngOnInit() {
    this.getLatestEarthquake();
  }

  async submit() {
    const parameterList = [
      {
        name: "minmag",
        value: this.minMagnitude,
      },
      {
        name: "maxmag",
        value: this.maxMagnitude,
      },
      {
        name: "mindepth",
        value: this.minDepth,
      },
      {
        name: "maxdepth",
        value: this.maxDepth,
      },
      {
        name: "eventid",
        value: this.eventId,
      },
      {
        name: "limit",
        value: this.limit,
      },
      {
        name: "orderby",
        value: this.selectedOption,
      },
      {
        name: "magtype",
        value: this.selectedType,
      },
    ];

    let parameters = `filter?start=${this.setDate(
      this.startDate
    )}&end=${this.setDate(this.endDate)}`;
    parameterList.forEach((param) => {
      if ((param.value && param.value.length > 0) || param.value != null) {
        parameters += this.setParams(param.name, param.value);
      }
    });

    let api = `https://deprem.afad.gov.tr/apiv2/event/` + parameters;

    const response = await fetch(api);
    const data = await response.json();
    this.tableData = data;

    this.generateEarthquakeMap();
  }

  setDate(value: string) {
    return value.toLocaleString();
  }

  setParams(key: any, value: any) {
    return value ? `&${key}=${value}` : "";
  }

  next() {
    this.first = this.first + this.rows;
  }

  prev() {
    this.first = this.first - this.rows;
  }

  reset() {
    this.first = 0;
  }

  isLastPage(): boolean {
    return this.tableData
      ? this.first === this.tableData.length - this.rows
      : true;
  }

  isFirstPage(): boolean {
    return this.tableData ? this.first === 0 : true;
  }

  get searchTable() {
    return this.tableData?.filter((element) =>
      element.location.toLowerCase().includes(this.searchText?.toLowerCase())
    );
  }

  exportExcel() {
    import("xlsx").then((xlsx) => {
      const mappedTable = this.searchTable.map((item) => ({
        date: item.date,
        latitude: item.latitude,
        longitude: item.longitude,
        depth: item.depth,
        type: item.type,
        magnitude: item.magnitude,
        location: item.location,
        eventId: item.eventID,
      }));
      const worksheet = xlsx.utils.json_to_sheet(mappedTable);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
      const excelBuffer: any = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      this.saveAsExcelFile(excelBuffer, "tableData");
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    let EXCEL_EXTENSION = ".xlsx";
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE,
    });
    FileSaver.saveAs(
      data,
      fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION
    );
  }

  generateEarthquakeMap() {
    const features: any = [];
    this.tableData?.forEach((quake) => {
      const feature = new Feature(
        new Point(fromLonLat([quake.longitude, quake.latitude]))
      );
      feature.setProperties({
        location: quake.location,
        date: quake.date,
        magnitude: quake.magnitude,
      });
      features.push(feature);
    });
    const source = new VectorSource({ features: features });
    const vectorLayer = new VectorLayer({ source: source });
    this.map = new Map({
      view: new View({
        center: [0, 0] /* Coordinates */,
        zoom: 2,
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      target: "ol-map",
    });
    let selected = null;
    let t = this;
    this.map.on("singleclick", function (e: any) {
      t.info.nativeElement.style.opacity = 0;
      t.map.forEachFeatureAtPixel(e.pixel, function (f: any) {
        selected = f;
        t.info.nativeElement.style.opacity = 1;
        const featuresSelect = selected.getProperties();
        t.info.nativeElement.innerHTML = ` <div class="info-popup">
                                            <ul>
                                              <li class="list-item">
                                                <span>Date:</span>
                                                <span>${featuresSelect.date}</span>
                                              </li>
                                              <li class="list-item"><span>Location:</span> <span>${featuresSelect.location}</span></li>
                                              <li class="list-item"><span>Magnitude:</span> <span>${featuresSelect.magnitude}</span></li>
                                            </ul>
                                          </div>`;
      });
    });
  }
  async getLatestEarthquake() {
    var todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    let tomorrow = new Date();
    tomorrow.setDate(todayDate.getDate() + 1);
    var today = todayDate.toLocaleString();
    console.log(today);
    let api = `https://deprem.afad.gov.tr/apiv2/event/filter?start=${today}&end=${this.setDate(
      tomorrow.toLocaleString()
    )}&orderby=time`;
    const response = await fetch(api);
    const data = await response.json();
    this.latestEarthquake = data[0].location;
  }
}
