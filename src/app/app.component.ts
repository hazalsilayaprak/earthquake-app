import { Component } from '@angular/core';
import * as FileSaver from 'file-saver';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  tableData: any[];
  cities: any[];
  provinces: any[];
  seaData: any[];
  districts: any[];

  selectedCity: {
    name: string;
    nameEng: string;
    id: number;
  };
  selectedProvince: {
    name: string;
    id: number;
  };

  selectedDistrict: {
    name: string;
    id: number;
  };

  selectedSea: {
    name: string;
    nameEng: string;
    id: number;
  };

  first = 0;
  rows = 10;

  searchText: string = '';

  cols: any[];
  exportColumns: any[];

  rangeDates: Date[];

  minLat: number = 26.0393;
  maxLat: number = 51.3683;

  minLongitude: number = 5.2193;
  maxLongitude: number = 64.0886;

  minDepth: number = 0;
  maxDepth: number = 0;

  minMagnitude: number = 0;
  maxMagnitude: number = 0;

  ngOnInit() {
    this.getTableData();
    this.getCountries();
    this.getProvinces();
    this.getSeaList();
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

  // exportPdf() {
  //   import('jspdf').then((jsPDF) => {
  //     import('jspdf-autotable').then((x) => {
  //       const doc = new jsPDF.default(0, 0);
  //       doc.autoTable(this.exportColumns, this.tableData);
  //       doc.save('tableData.pdf');
  //     });
  //   });
  // }

  exportExcel() {
    import('xlsx').then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(this.tableData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      this.saveAsExcelFile(excelBuffer, 'tableData');
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE,
    });
    FileSaver.saveAs(
      data,
      fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
    );
  }

  async getCountries() {
    let api = 'https://deprem.afad.gov.tr/Geography/GetCountries';
    const response = await fetch(api);
    const data = await response.json();
    this.cities = data;
  }

  async getProvinces() {
    let api = 'https://deprem.afad.gov.tr/Geography/GetProvinces';
    const response = await fetch(api);
    const data = await response.json();
    this.provinces = data;
  }

  async getSeaList() {
    let api = 'https://deprem.afad.gov.tr/Geography/GetSeas';
    const response = await fetch(api);
    const data = await response.json();
    this.seaData = data;
  }

  async getDistrict() {
    let api =
      'https://deprem.afad.gov.tr/Geography/GetDistrictByProvinceId' +
      this.selectedProvince.id;
    const response = await fetch(api);
    const data = await response.json();
    this.districts = data;
  }

  provinceSelect() {
    this.getDistrict();
  }

  async getTableData() {
    let api =
      'https://deprem.afad.gov.tr/apiv2/event/filter?start=2022-09-14%2010:00:00&end=2022-09-16%2010:00:00';

    const response = await fetch(api);
    const data = await response.json();
    this.tableData = data;
  }
}
