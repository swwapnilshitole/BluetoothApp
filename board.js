import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.scss';
// import * as React from 'react';
// import * as ReactDOM from "react-dom";
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { ExcelExport } from '@progress/kendo-react-excel-export';
import chart from '../../fsa-style/img/chart.svg';
import microscope from '../../fsa-style/img/microscope.svg';
import CloseIcon from '../../fsa-style/img/Fill24.svg';
// import PrevMonthIcon from '../../fsa-style/img/Fill127.svg';
import PrevDayIcon from '../../fsa-style/img/Fill128.svg';
import nextDayIcon from '../../fsa-style/img/Fill126.svg';
import nextIterationIcon from '../../fsa-style/img/Fill123.svg';
import prevIterationIcon from '../../fsa-style/img/Fill127.svg';
// import nextMonthIcon from '../../fsa-style/img/Fill123.svg';
import ResetIcon from '../../fsa-style/img/Fill21.svg';

import caretUp from '../../fsa-style/img/svgs/caret-up.svg';
import caretDown from '../../fsa-style/img/svgs/caret-down.svg';
import plusIcon from '../../fsa-style/img/svgs/plus.svg';

import _ from 'lodash';
// import { Chart, ChartSeries, ChartSeriesItem } from '@progress/kendo-react-charts';
import { Chart, ChartTitle, ChartSeries, ChartSeriesItem, ChartCategoryAxis, ChartCategoryAxisTitle, ChartCategoryAxisItem, ChartLegend } from '@progress/kendo-react-charts';
import { NotificationContainer, NotificationManager } from 'react-notifications';

import moment from 'moment';
import Modal from 'react-bootstrap/Modal';

import Button from 'react-bootstrap/Button';
import 'hammerjs';
import { useDispatch } from 'react-redux';
// import { getMessagesCountNew } from '../../services/actions/action';
import {
  getDashboardData,
  getUserPreferencesData,
  updateUserPreferenceData,
  getIndicatorInteration,
  updateDashboardCards,
  removeDashboardCards,
} from '../../services/dashboardService';
import LoadingSplash from '../LoadingSplash/LoadingSplash';
import { v4 as uuidv4 } from 'uuid';

const BUFFER_SIZE = 50;

const Dashboard = () => {
  const [currIndex, setCurrIndex] = useState(0);
  const [data, setData] = useState([]);
  const [dashboardData, setdashboardData] = useState([]);
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [drillDownData, setDrillDownData] = useState([]);
  const [newCardsData, setNewCardsData] = useState([
    { id: 1, isAddSelected: false },
    { id: 2, isAddSelected: false },
    { id: 3, isAddSelected: false },
    { id: 4, isAddSelected: false },
    { id: 5, isAddSelected: false },
    { id: 6, isAddSelected: false },
  ]);
  // For Drag and Drop Start
  const [dropIndex, setDropIndex] = useState();
  const [startIndex, setStartIndex] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [disablePreviousButton, setDisablePreviousButton] = useState({});
  const [disablePreviousAccordianButton, setDisablePreviousAccordianButton] = useState({});

  const dragEnter = (e, position) => {
    setDropIndex(position);
  };
  const dragStart = (e, position) => {
    setStartIndex(position);
  };

  const drop = (e, position) => {
    const copyListItems = [...newCardsData];
    const pickedIndex = copyListItems[startIndex];
    const replacedWithIndex = copyListItems[dropIndex];
    copyListItems.splice(startIndex, 1, replacedWithIndex); // This will insert replacedWith element with starting Index
    copyListItems.splice(dropIndex, 1, pickedIndex); // This will insert picked element with drop Index
    setNewCardsData(copyListItems);
    // updateUserPreference(copyListItems);
    updateCards(copyListItems);
  };
  // For Drag and Drop End

  const addToEmptyNewCardData = (objADD, idx) => {
    let isAddSelected = true;
    let iterationNbr = objADD.Max_Iteration_Nbr;
    if (idx) {
      newCardsData.map((obj) => {
        if (obj.id === idx) {
          newCardsData.splice(idx - 1, 1, { ...objADD, isAddSelected, iterationNbr });
          setCurrIndex(currIndex + 1);
        }
        return null;
      });
    } else {
      let iterationNbr = objADD.Max_Iteration_Nbr;
      newCardsData.pop();
      newCardsData.unshift({ ...objADD, isAddSelected, iterationNbr });
      setCurrIndex(currIndex + 1);
    }
  };

  const removeFromNewCardData = (objREMOVE, idx) => {
    let isAddSelected = false;
    let newId;

    let newData = newCardsData.map((obj, objIdx) => {
      if (objIdx === idx) {
        newId = obj.Card_Id;
        return { ...{}, id: objIdx + 1, isAddSelected };
      }
      return { ...obj };
    });

    let len = newData.length;
    RemoveCards(_.cloneDeep(newCardsData), newId);
    let result = newData.splice(idx, 1);
    newData.splice(len, 0, result[0]);
    createNotification();
    setNewCardsData(_.cloneDeep(newData));
  };

  const RemoveCards = async (data, idx) => {
    const user = JSON.parse(sessionStorage.getItem('user_information'));
    let userPayloadData = {
      // kpi_1: '',
      contextId: user.contextId,
      role: user.rolesName[0],
      activeInd: false,
    };
    let id;

    const removePreferencesPayload = data.map((itm, index) => {
      if (itm.Card_Id && itm.Card_Id === idx) {
        id = 'kpi_' + ++index;
        // userPayloadData[id] = itm.Card_Id;
        userPayloadData['cardId'] = itm.Card_Id;
      }
      return null;
    });

    Promise.all(removePreferencesPayload)
      .then((results) => {
        removeDashboardCards(userPayloadData);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const ArrowOpen = (obj3) => {
    let newData = dashboardData.map((obj4) => {
      if (obj4.id === obj3.id && obj4.isExpand === false) {
        return (obj4.isExpand = true), { ...obj4 };
      } else {
        return (obj4.isExpand = false), { ...obj4 };
      }
    });
    setdashboardData(newData);
  };

  const microscopeFunc = (obj) => {
    setShow(true);
    setDrillDownData([{ ...obj }]);
  };

  // next&previous Date Func start
  const nextDay = async (element, idx) => {
    if (element.iterationNbr === null || element.iterationNbr === undefined) {
      return;
    }
    let dataset = [];
    let findCurrentEle = [];
    let currentIndex;
    const { Display_Type, Card_Id } = element;
    setDisablePreviousButton({ isDisable: false, cardId: Card_Id });

    if (element.iterationNbrdata === undefined) {
      let result = await getIndicatorInteration(element.Indicator_ID, element.iterationNbr, BUFFER_SIZE);
      dataset = result.data;
    } else {
      dataset = element.iterationNbrdata;
    }

    let newData = newCardsData.map((obj, objIdx) => {
      if (objIdx === idx) {
        findCurrentEle = dataset?.find((itm) => itm.iterationNbr === element.iterationNbr);
        currentIndex = dataset?.indexOf(findCurrentEle);
        let iterationd = dataset[currentIndex - 1];

        if (iterationd === undefined) iterationd = [];
        return (
          (obj.Iteration_DTTM = moment(iterationd?.iterationDttm)),
          (obj.combine_dataset = obj.Benchmark_Data.concat(!!iterationd?.iterationNbr ? JSON.parse(iterationd?.iterationDataset) : [])),
          (obj.iterationNbr = !!iterationd?.iterationNbr ? iterationd.iterationNbr : obj.iterationNbr),
          (obj.iterationNbrdata = dataset),
          { ...obj }
        );
      }
      return { ...obj };
    });

    setNewCardsData(_.cloneDeep(newData));
  };

  const prevDay = async (element, idx) => {
    if (element.iterationNbr === null || element.iterationNbr === undefined) {
      return;
    }
    let dataset = [];
    let findCurrentEle = [];
    let currentIndex;
    const { Display_Type, Card_Id } = element;

    if (element.iterationNbrdata === undefined) {
      let result = await getIndicatorInteration(element.Indicator_ID, element.iterationNbr, BUFFER_SIZE);
      dataset = result.data;
    } else {
      dataset = element.iterationNbrdata;
    }
    let newData = newCardsData.map((obj, objIdx) => {
      if (objIdx === idx) {
        findCurrentEle = dataset?.find((itm) => itm.iterationNbr === element.iterationNbr);
        currentIndex = dataset?.indexOf(findCurrentEle);
        let iterationd = dataset[currentIndex + 1];
        let flagIndex = currentIndex + 1;

        if (flagIndex >= dataset.length - 1) {
          setDisablePreviousButton({ isDisable: true, cardId: Card_Id });
        }
        if (iterationd === undefined) iterationd = [];
        return (
          (obj.Iteration_DTTM = moment(iterationd?.iterationDttm)),
          (obj.combine_dataset = obj.Benchmark_Data.concat(!!iterationd?.iterationNbr ? JSON.parse(iterationd?.iterationDataset) : [])),
          (obj.iterationNbr = !!iterationd?.iterationNbr ? iterationd.iterationNbr : obj.iterationNbr),
          (obj.iterationNbrdata = dataset),
          { ...obj }
        );
      }
      return { ...obj };
    });

    setNewCardsData(_.cloneDeep(newData));
  };

  const resetDate = async (ele, index) => {
    setDisablePreviousButton({});
    let dataset = [];
    const { Display_Type, Card_Id } = ele;
    if (ele.iterationNbrdata === undefined) {
      let result = await getIndicatorInteration(ele.Indicator_ID, ele.iterationNbr, BUFFER_SIZE);
      dataset = result.data;
    } else {
      dataset = ele.iterationNbrdata;
    }
    let newData = newCardsData.map((obj, objIdx) => {
      if (objIdx === index) {
        return (
          (obj.Iteration_DTTM = moment(obj.original_DTTM)),
          (obj.combine_dataset = obj.combine_dataset_ForReset),
          (obj.iterationNbr = obj.Max_Iteration_Nbr),
          (obj.iterationNbrdata = dataset),
          { ...obj }
        );
      }
      return { ...obj };
    });
    setNewCardsData(_.cloneDeep(newData));
  };

  const prevInterval = async (element, idx) => {
    if (element.iterationNbr === null || element.iterationNbr === undefined) {
      return;
    }
    let dataset = [];
    let findCurrentEle = [];
    let currentIndex;
    const { Display_Type, Card_Id, Jump } = element;
    if (element.iterationNbrdata === undefined) {
      let result = await getIndicatorInteration(element.Indicator_ID, element.iterationNbr, BUFFER_SIZE);
      dataset = result.data;
    } else {
      dataset = element.iterationNbrdata;
    }
    let newData = newCardsData.map((obj, objIdx) => {
      if (objIdx === idx) {
        findCurrentEle = dataset?.find((itm) => itm.iterationNbr === element.iterationNbr);
        currentIndex = dataset?.indexOf(findCurrentEle);
        let recordIndex;

        if (Jump !== null && Jump !== undefined) {
          recordIndex = currentIndex + Jump;
        }
        let iterationd = dataset[recordIndex];
        if (iterationd === undefined) {
          iterationd = dataset[dataset.length - 1];
        }
        if (recordIndex >= dataset.length - 1 || recordIndex === undefined || recordIndex === null) {
          setDisablePreviousButton({ isDisable: true, cardId: Card_Id });
        }
        if (iterationd === undefined) iterationd = [];
        return (
          (obj.Iteration_DTTM = moment(iterationd?.iterationDttm)),
          (obj.combine_dataset = obj.Benchmark_Data.concat(!!iterationd?.iterationNbr ? JSON.parse(iterationd?.iterationDataset) : [])),
          (obj.iterationNbr = !!iterationd?.iterationNbr ? iterationd.iterationNbr : obj.iterationNbr),
          (obj.iterationNbrdata = dataset),
          { ...obj }
        );
      }
      return { ...obj };
    });

    setNewCardsData(_.cloneDeep(newData));
  };

  const nextInterval = async (element, idx) => {
    if (element.iterationNbr === null || element.iterationNbr === undefined) {
      return;
    }
    let dataset = [];
    let findCurrentEle = [];
    let currentIndex;
    const { Display_Type, Card_Id, Jump } = element;
    setDisablePreviousButton({ isDisable: false, cardId: Card_Id });

    if (element.iterationNbrdata === undefined) {
      let result = await getIndicatorInteration(element.Indicator_ID, element.iterationNbr, BUFFER_SIZE);
      dataset = result.data;
    } else {
      dataset = element.iterationNbrdata;
    }

    let newData = newCardsData.map((obj, objIdx) => {
      if (objIdx === idx) {
        findCurrentEle = dataset?.find((itm) => itm.iterationNbr === element.iterationNbr);
        currentIndex = dataset?.indexOf(findCurrentEle);

        let recordIndex;

        if (Jump !== null && Jump !== undefined) {
          recordIndex = currentIndex - Jump;
        }
        let iterationd = dataset[recordIndex];
        if (iterationd === undefined) iterationd = dataset[0];
        if (iterationd === undefined) iterationd = [];
        return (
          (obj.Iteration_DTTM = moment(iterationd?.iterationDttm)),
          (obj.combine_dataset = obj.Benchmark_Data.concat(!!iterationd?.iterationNbr ? JSON.parse(iterationd?.iterationDataset) : [])),
          (obj.iterationNbr = !!iterationd?.iterationNbr ? iterationd.iterationNbr : obj.iterationNbr),
          (obj.iterationNbrdata = dataset),
          { ...obj }
        );
      }
      return { ...obj };
    });

    setNewCardsData(_.cloneDeep(newData));
  };

  const resetDateAccordian = async (ele, idx) => {
    setDisablePreviousAccordianButton({});
    let dataset = [];
    if (ele.Collection7[idx].iterationNbrdata === undefined) {
      let result = await getIndicatorInteration(ele.Collection7[idx].Indicator_ID, ele.Collection7[idx].iterationNbr, BUFFER_SIZE);
      dataset = result.data;
    } else {
      dataset = ele.Collection7[idx].iterationNbrdata;
    }
    let newData = dashboardData.map((obj, index) => {
      if (obj.Collection7[idx]?.Card_Id === ele.Collection7[idx]?.Card_Id) {
        // console.log(obj.Collection7[idx]);

        return (
          (obj.Collection7[idx].Iteration_DTTM = moment(obj.Collection7[idx]?.original_DTTM)),
          (obj.Collection7[idx].combine_dataset = obj.Collection7[idx]?.combine_dataset_ForReset),
          (obj.Collection7[idx].iterationNbr = obj.Collection7[idx]?.Max_Iteration_Nbr),
          (obj.Collection7[idx].iterationNbrdata = dataset),
          { ...obj }
        );
      } else {
        return { ...obj };
      }
    });
    // console.log(newData, 'newData');
    setdashboardData(newData);
  };

  const prevDayAccordian = async (element, idx) => {
    if (element.iterationNbr === null || element.iterationNbr === undefined) {
      return;
    }
    let dataset = [];
    let findCurrentEle = [];
    let currentIndex;
    const { Card_Id } = element.Collection7[idx];
    if (element.Collection7[idx].iterationNbrdata === undefined) {
      let result = await getIndicatorInteration(element.Collection7[idx].Indicator_ID, element.Collection7[idx].iterationNbr, BUFFER_SIZE);
      dataset = result.data;
    } else {
      dataset = element.Collection7[idx].iterationNbrdata;
    }

    findCurrentEle = dataset?.find((itm) => itm.iterationNbr === element.Collection7[idx].iterationNbr);
    currentIndex = dataset?.indexOf(findCurrentEle);

    let iterationd = dataset[currentIndex + 1];
    let flagIndex = currentIndex + 1;
    if (flagIndex >= dataset.length - 1) {
      setDisablePreviousAccordianButton({ isDisable: true, cardId: Card_Id });
    }
    if (iterationd === undefined) iterationd = [];

    let newData = dashboardData.map((obj, index) => {
      if (obj.Collection7[idx]?.Card_Id === element.Collection7[idx]?.Card_Id) {
        return (
          (obj.Collection7[idx].Iteration_DTTM = moment(iterationd?.iterationDttm)),
          (obj.Collection7[idx].combine_dataset = element.Collection7[idx]?.Benchmark_Data.concat(!!iterationd?.iterationNbr ? JSON.parse(iterationd?.iterationDataset) : [])),
          (obj.Collection7[idx].iterationNbr = !!iterationd?.iterationNbr ? iterationd?.iterationNbr : element.Collection7[idx]?.iterationNbr),
          (obj.Collection7[idx].iterationNbrdata = dataset),
          { ...obj }
        );
      } else {
        return { ...obj };
      }
    });
    setdashboardData(newData);
  };

  const nextDayAccordian = async (element, idx) => {
    if (element.iterationNbr === null || element.iterationNbr === undefined) {
      return;
    }
    let dataset = [];
    let findCurrentEle = [];
    let currentIndex;
    const { Card_Id } = element.Collection7[idx];
    setDisablePreviousAccordianButton({ isDisable: false, cardId: Card_Id });
    if (element.Collection7[idx].iterationNbrdata === undefined) {
      let result = await getIndicatorInteration(element.Collection7[idx].Indicator_ID, element.Collection7[idx].iterationNbr, BUFFER_SIZE);
      dataset = result.data;
    } else {
      dataset = element.Collection7[idx].iterationNbrdata;
    }

    findCurrentEle = dataset?.find((itm) => itm.iterationNbr === element.Collection7[idx].iterationNbr);
    currentIndex = dataset?.indexOf(findCurrentEle);

    let iterationd = dataset[currentIndex - 1];
    if (iterationd === undefined) iterationd = [];

    let newData = dashboardData.map((obj, index) => {
      if (obj.Collection7[idx]?.Card_Id === element.Collection7[idx]?.Card_Id) {
        return (
          (obj.Collection7[idx].Iteration_DTTM = moment(iterationd?.iterationDttm)),
          (obj.Collection7[idx].combine_dataset = element.Collection7[idx]?.Benchmark_Data.concat(!!iterationd?.iterationNbr ? JSON.parse(iterationd?.iterationDataset) : [])),
          (obj.Collection7[idx].iterationNbr = !!iterationd?.iterationNbr ? iterationd?.iterationNbr : element.Collection7[idx]?.iterationNbr),
          (obj.Collection7[idx].iterationNbrdata = dataset),
          { ...obj }
        );
      } else {
        return { ...obj };
      }
    });
    setdashboardData(newData);
  };
  const createNotification = () => {
    NotificationManager.success('Chart has been removed from key indicators', '', 3000);
  };

  const nextIntervalAccordian = async (element, idx) => {
    if (element.iterationNbr === null || element.iterationNbr === undefined) {
      return;
    }
    let dataset = [];
    let findCurrentEle = [];
    let currentIndex;
    const { Card_Id, Jump } = element.Collection7[idx];

    setDisablePreviousAccordianButton({ isDisable: false, cardId: Card_Id });

    if (element.Collection7[idx].iterationNbrdata === undefined) {
      let result = await getIndicatorInteration(element.Collection7[idx].Indicator_ID, element.Collection7[idx].iterationNbr, BUFFER_SIZE);
      dataset = result.data;
    } else {
      dataset = element.Collection7[idx].iterationNbrdata;
    }

    findCurrentEle = dataset?.find((itm) => itm.iterationNbr === element.Collection7[idx].iterationNbr);
    currentIndex = dataset?.indexOf(findCurrentEle);

    let recordIndex;

    if (Jump !== null && Jump !== undefined) {
      recordIndex = currentIndex - Jump;
    }
    let iterationd = dataset[recordIndex];
    if (iterationd === undefined) iterationd = dataset[0];
    if (iterationd === undefined) iterationd = [];

    let newData = dashboardData.map((obj, index) => {
      if (obj.Collection7[idx]?.Card_Id === element.Collection7[idx]?.Card_Id) {
        return (
          (obj.Collection7[idx].Iteration_DTTM = moment(iterationd?.iterationDttm)),
          (obj.Collection7[idx].combine_dataset = element.Collection7[idx]?.Benchmark_Data.concat(!!iterationd?.iterationNbr ? JSON.parse(iterationd?.iterationDataset) : [])),
          (obj.Collection7[idx].iterationNbr = !!iterationd?.iterationNbr ? iterationd?.iterationNbr : element.Collection7[idx]?.iterationNbr),
          (obj.Collection7[idx].iterationNbrdata = dataset),
          { ...obj }
        );
      } else {
        return { ...obj };
      }
    });
    setdashboardData(newData);
  };

  const prevIntervalAccordian = async (element, idx) => {
    if (element.iterationNbr === null || element.iterationNbr === undefined) {
      return;
    }
    let dataset = [];
    let findCurrentEle = [];
    let currentIndex;
    const { Card_Id, Jump } = element.Collection7[idx];
    if (element.Collection7[idx].iterationNbrdata === undefined) {
      let result = await getIndicatorInteration(element.Collection7[idx].Indicator_ID, element.Collection7[idx].iterationNbr, BUFFER_SIZE);
      dataset = result.data;
    } else {
      dataset = element.Collection7[idx].iterationNbrdata;
    }

    findCurrentEle = dataset?.find((itm) => itm.iterationNbr === element.Collection7[idx].iterationNbr);
    currentIndex = dataset?.indexOf(findCurrentEle);

    let recordIndex;
    if (Jump !== null && Jump !== undefined) {
      recordIndex = currentIndex + Jump;
    }
    let iterationd = dataset[recordIndex];

    if (iterationd === undefined) {
      iterationd = dataset[dataset.length - 1];
    }
    if (recordIndex >= dataset.length - 1 || recordIndex === undefined || recordIndex === null) {
      setDisablePreviousAccordianButton({ isDisable: true, cardId: Card_Id });
    }

    if (iterationd === undefined) iterationd = [];

    let newData = dashboardData.map((obj, index) => {
      if (obj.Collection7[idx]?.Card_Id === element.Collection7[idx]?.Card_Id) {
        return (
          (obj.Collection7[idx].Iteration_DTTM = moment(iterationd?.iterationDttm)),
          (obj.Collection7[idx].combine_dataset = element.Collection7[idx]?.Benchmark_Data.concat(!!iterationd?.iterationNbr ? JSON.parse(iterationd?.iterationDataset) : [])),
          (obj.Collection7[idx].iterationNbr = !!iterationd?.iterationNbr ? iterationd?.iterationNbr : element.Collection7[idx]?.iterationNbr),
          (obj.Collection7[idx].iterationNbrdata = dataset),
          { ...obj }
        );
      } else {
        return { ...obj };
      }
    });
    setdashboardData(newData);
  };

  useEffect(() => {
    async function getData() {
      let userPreferencesData = await getUserPreferencesData();
      let data = await getDashboardData();
      // let iterationDataset = await getIndicatorInteration(ele.Indicator_ID, 7, BUFFER_SIZE);
      // console.log(iterationDataset, 'iterationDataset');
      // dispatch(getMessagesCountNew());
      let i = 1;
      let newdata = data.data;
      if (newdata?.length > 0) {
        newdata.map((obj) => {
          return (
            (obj.Collection7 = JSON.parse(obj.cards).map((itm) => {
              let lineChartDataBench = [];
              let lineChartDataIteration = [];
              if (itm.Display_Type.toLowerCase() === 'line') {
                itm.Benchmark_Data.length > 0 &&
                  itm.Benchmark_Data[0].data.map((rec) => {
                    return lineChartDataBench.push(rec.value);
                  });

                itm?.Iteration_DataSet?.length > 0 &&
                  itm?.Iteration_DataSet[0]?.data?.map((rec) => {
                    return lineChartDataIteration.push(rec.value);
                  });
              }
              if (itm.Display_Type.toLowerCase() === 'bar') {
                // Check and process Benchmark Data
                itm.Benchmark_Data.length > 0 &&
                  itm.Benchmark_Data[0].data.map((rec) => {
                    return lineChartDataBench.push(rec.value);
                  });

                // Check and process Iteration DataSet
                itm?.Iteration_DataSet &&
                  itm?.Iteration_DataSet?.data?.length > 0 &&
                  itm?.Iteration_DataSet?.data.map((rec) => {
                    return lineChartDataIteration.push(rec.value);
                  });
              }
              if (itm.Display_Type.toLowerCase() === 'text') {
                itm.Benchmark_Data.length > 0 &&
                  itm.Benchmark_Data[0].data.map((rec) => {
                    return lineChartDataBench.push({ value: rec.value, name: rec.category });
                  });

                itm?.Iteration_DataSet?.length > 0 &&
                  itm?.Iteration_DataSet[0]?.data.map((rec) => {
                    if (lineChartDataBench.length > 0) {
                      let index = _.findIndex(lineChartDataBench, { name: rec.category });
                      lineChartDataBench[index].value2 = rec.value;
                    }
                    return lineChartDataBench;
                  });
              }
              return (
                (itm.original_DTTM = itm.Iteration_DTTM),
                (itm.combine_dataset = itm.Benchmark_Data?.concat(itm?.Iteration_DataSet)),
                (itm.combine_dataset_ForReset = itm.Benchmark_Data?.concat(itm?.Iteration_DataSet)),
                (itm.iterationNbr = itm.Max_Iteration_Nbr),
                itm.Display_Type.toLowerCase() === 'bar' ? ((itm.barChartDataBench = lineChartDataBench), (itm.barChartDataIteration = lineChartDataIteration)) : [],
                itm.Display_Type.toLowerCase() === 'text' ? (itm.tableData = lineChartDataBench) : [],
                itm.Display_Type.toLowerCase() === 'line' ? ((itm.lineChartDataBench = lineChartDataBench), (itm.lineChartDataIteration = lineChartDataIteration)) : [],
                { ...itm }
              );
            })),
            (obj.name = obj.indicatorGroupName),
            (obj.isExpand = false),
            (obj.id = i++)
          );
        });
        setdashboardData(newdata);
        newdata.map((itm, idx) => {
          let indexz1 = _.findIndex(itm.Collection7, ['Card_Id', userPreferencesData?.data?.[0]?.activeInd === true && userPreferencesData?.data?.[0]?.cardId]);
          let indexz2 = _.findIndex(itm.Collection7, ['Card_Id', userPreferencesData?.data?.[1]?.activeInd === true && userPreferencesData?.data?.[1]?.cardId]);
          let indexz3 = _.findIndex(itm.Collection7, ['Card_Id', userPreferencesData?.data?.[2]?.activeInd === true && userPreferencesData?.data?.[2]?.cardId]);
          let indexz4 = _.findIndex(itm.Collection7, ['Card_Id', userPreferencesData?.data?.[3]?.activeInd === true && userPreferencesData?.data?.[3]?.cardId]);
          let indexz5 = _.findIndex(itm.Collection7, ['Card_Id', userPreferencesData?.data?.[4]?.activeInd === true && userPreferencesData?.data?.[4]?.cardId]);
          let indexz6 = _.findIndex(itm.Collection7, ['Card_Id', userPreferencesData?.data?.[5]?.activeInd === true && userPreferencesData?.data?.[5]?.cardId]);
          if (indexz1 !== -1) {
            addToEmptyNewCardData(itm.Collection7[indexz1], 1);
            setNewCardsData([...newCardsData]);
          }

          if (indexz2 !== -1) {
            addToEmptyNewCardData(itm.Collection7[indexz2], 2);
            setNewCardsData([...newCardsData]);
          }
          if (indexz3 !== -1) {
            addToEmptyNewCardData(itm.Collection7[indexz3], 3);
            setNewCardsData([...newCardsData]);
          }
          if (indexz4 !== -1) {
            addToEmptyNewCardData(itm.Collection7[indexz4], 4);
            setNewCardsData([...newCardsData]);
          }
          if (indexz5 !== -1) {
            addToEmptyNewCardData(itm.Collection7[indexz5], 5);
            setNewCardsData([...newCardsData]);
          }
          if (indexz6 !== -1) {
            addToEmptyNewCardData(itm.Collection7[indexz6], 6);
            setNewCardsData([...newCardsData]);
          }
          setIsLoading(false);

          return;
        });
      }

      setIsLoading(false);

      // this will set the Max_Iteration_Nbr to iterationNbr start
      let newdataForIterationNbr = newCardsData.map((obj, idx) => {
        return (obj.iterationNbr = obj.Max_Iteration_Nbr), { ...obj };
      });
      setNewCardsData(newdataForIterationNbr);
      // this will set the Max_Iteration_Nbr to iterationNbr end
    }

    getData();
  }, []);

  const updateUserPreference = async (data, x) => {
    const user = JSON.parse(sessionStorage.getItem('user_information'));
    let userPayloadData = {
      // kpi_1: '',
      contextId: user.contextId,
      role: user.rolesName[0],
      activeInd: true,
      cardId: data,
    };

    const result = await updateUserPreferenceData(userPayloadData);
    if (result.data) {
      addToEmptyNewCardData(x);
    }
  };

  const updateCards = async (data) => {
    const user = JSON.parse(sessionStorage.getItem('user_information'));
    let userPayloadData = {
      // kpi_1: '',
      contextId: user.contextId,
      role: user.rolesName[0],
      activeInd: true,
    };
    let id;

    const userPreferencesPayload = data.map((itm, index) => {
      if (itm.Card_Id && itm.Card_Id !== '') {
        id = 'kpi_' + ++index;
        // userPayloadData[id] = itm.Card_Id;
        userPayloadData['cardId'] = itm.Card_Id;
      }
      return null;
    });

    Promise.all(userPreferencesPayload)
      .then((results) => {
        updateDashboardCards(userPayloadData);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  // const labelContent = (e) => `${e.category}: \n ${e.value}%`;

  // Donut code start
  const mapSeries = (series, index, array) => (
    <ChartSeriesItem
      type="donut"
      key={uuidv4()}
      startAngle={150}
      name={series.name}
      data={series.data}
      field="value"
      categoryField="category"
      colorField="color"
      tooltip={{
        visible: true,
        render: renderTooltip,
        width: 120,
        position: 'center',
      }}
    ></ChartSeriesItem>
  );
  // Donut code end

  const renderTooltip = (context) => {
    const { category, series, value } = context.point || context;
    return (
      <span style={{ width: 300 }}>
        {category} ({series.name}): {value}%
      </span>
    );
  };

  // console.log(newCardsData, dashboardData, 'newCardsData,dashboardData');

  return (
    <main className="dashboard-main content w-100" data-testid="dashboard-main">
      <NotificationContainer />
      {isLoading ? (
        <LoadingSplash data-testid="loading-splash"></LoadingSplash>
      ) : (
        <>
          <Modal show={show} size="xl" onHide={() => setShow(false)} data-testid="modal">
            <Modal.Header>
              <Modal.Title data-testid="modal-title">{drillDownData && drillDownData[0]?.Card_Display_Name}</Modal.Title>
              <Button variant="secondary" onClick={() => setShow(false)} data-testid="modal-close-button">
                ✖
              </Button>
            </Modal.Header>
            <Modal.Body>
              {drillDownData.length > 0 && (
                <TableKendo Grid={Grid} GridColumn={GridColumn} GridToolbar={GridToolbar} ExcelExport={ExcelExport} products={drillDownData[0]?.Benchmark_Data[0]?.data} />
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShow(false)} data-testid="modal-footer-close-button">
                Close
              </Button>
            </Modal.Footer>
          </Modal>
          <div>
            <p className="title" data-testid="dashboard-title">
              <b>{data.indicator}</b>
            </p>
          </div>
          <div className="container-fluid dashboard-container" data-testid="dashboard-container">
            {/* Card Block Start */}
            <div className="row" data-testid="card-block">
              {newCardsData.map((x, index) => {
                return (
                  <div
                    key={index + 'card_block'}
                    className="col-sm-12 col-md-6 col-lg-4 col-xxl-4 mt-3 mb-4 p-3 d-flex justify-content-between"
                    draggable
                    onDragStart={(e) => dragStart(e, index)}
                    onDragEnter={(e) => dragEnter(e, index)}
                    onDragEnd={drop}
                    data-testid={`card-block-${index}`}
                  >
                    <div className="card position-relative card-outer p-0" data-testid={`card-${index}`}>
                      <div className={'header Route_Type_return1'}>
                        <div className={'row card-header-bar-outer ' + (x.isAddSelected === false && ' disabled')}>
                          <div>
                            <img src={chart} className="pie-chartIcon" alt="pie-chartIcon" />
                          </div>
                          <div>
                            <span>
                              <h5 className="mt-2 text-white text-center" key={uuidv4()} data-testid={`card-title-${index}`}>
                                {x.Card_Display_Name}
                              </h5>
                            </span>
                          </div>
                          <div>
                            <img
                              src={microscope}
                              style={{ opacity: x.Drillable === true ? '1' : '0.5', pointerEvents: x.Drillable === true ? 'auto' : 'none' }}
                              onClick={() => microscopeFunc(x, index, mapSeries)}
                              className="icon-default-size mr-3"
                              alt="microscopeIcon"
                              data-testid={`microscope-icon-${index}`}
                            />
                            <img
                              src={CloseIcon}
                              className="icon-default-size"
                              alt="closeIcon"
                              onClick={() => removeFromNewCardData(x, index)}
                              data-testid={`close-icon-${index}`}
                            />
                          </div>
                        </div>
                      </div>
                      <div style={{ color: 'black' }}>
                        <div style={{ height: '400px' }}>
                          {/* {(!!x.Iteration_DTTM || !!x.Card_Display_Name) && (
                            <Chart>
                              <ChartSeries>{x.combine_dataset.map(mapSeries)}</ChartSeries>
                            </Chart>
                          )} */}
                          {x.Display_Type === 'Donut' ? (
                            (!!x.Iteration_DTTM || !!x.Card_Display_Name) && (
                              <Chart transitions={false}>
                                <ChartTitle text={x.Card_Description} />
                                {x.Include_Benchmark_Display === true ? (
                                  <>
                                    <ChartSeries>{x.combine_dataset.map(mapSeries)}</ChartSeries>
                                    {/* Shown legends of only outer circle */}
                                    <ChartLegend
                                      position="right"
                                      labels={{
                                        template: (dataItem) => {
                                          if (x.combine_dataset.length !== 0 && dataItem?.hasOwnProperty('dataItem')) {
                                            const legendItem =
                                              x.combine_dataset?.length > 1
                                                ? x.combine_dataset[1]?.data
                                                  ? x.combine_dataset[1]?.data?.find(
                                                      (item) => item.category === dataItem?.dataItem?.category && item.value === dataItem?.dataItem?.value
                                                    )
                                                  : x.combine_dataset[0]?.data?.find(
                                                      (item) => item.category === dataItem?.dataItem?.category && item.value === dataItem?.dataItem?.value
                                                    )
                                                : '';
                                            return legendItem ? `${legendItem.category}` : '';
                                          }
                                        },
                                      }}
                                    />
                                  </>
                                ) : (
                                  <ChartSeries>
                                    {x.combine_dataset.length > 1 &&
                                      x.combine_dataset.slice(1, 2).map((series) => (
                                        <ChartSeriesItem
                                          type="donut"
                                          key={uuidv4()}
                                          startAngle={150}
                                          name={series.name}
                                          data={series.data}
                                          field="value"
                                          categoryField="category"
                                          colorField="color"
                                          tooltip={{
                                            visible: true,
                                            render: renderTooltip,
                                            width: 120,
                                            position: 'center',
                                          }}
                                        ></ChartSeriesItem>
                                      ))}
                                  </ChartSeries>
                                )}
                              </Chart>
                            )
                          ) : x.Display_Type === 'Line' ? (
                            <Chart transitions={false}>
                              <ChartTitle text={x.Card_Description} />
                              <ChartCategoryAxis>
                                <ChartCategoryAxisItem
                                  labels={{ rotation: 'auto' }}
                                  // BAS-3241 Remove monthly label from dashboard
                                  // title={{
                                  //   text: 'Monthly',
                                  // }}
                                  categories={x.Benchmark_Data[0].data.map((item) => item.category)}
                                />
                              </ChartCategoryAxis>
                              <ChartSeries>
                                {x.Include_Benchmark_Display === true && (
                                  <ChartSeriesItem
                                    color={'#FF6358'}
                                    tooltip={{
                                      visible: true,
                                      width: 120,
                                      position: 'center',
                                    }}
                                    type="line"
                                    data={x?.lineChartDataBench}
                                  />
                                )}
                                {/* {x.Include_Benchmark_Display === true && ( */}
                                <ChartSeriesItem
                                  color={'#FFD246'}
                                  tooltip={{
                                    visible: true,
                                    width: 120,
                                    position: 'center',
                                  }}
                                  type="line"
                                  data={x?.combine_dataset[1]?.data?.map((item) => item?.value)}
                                />
                                {/* )} */}
                              </ChartSeries>
                            </Chart>
                          ) : x.Display_Type === 'Bar' ? (
                            <Chart transitions={false}>
                              <ChartTitle text={x.Card_Description} />
                              <ChartCategoryAxis
                              // BAS-3241 Remove monthly label from dashboard
                              // title={{
                              //   text: 'Monthly',
                              // }}
                              >
                                <ChartCategoryAxisItem labels={{ rotation: 'auto' }} categories={x.Benchmark_Data[0].data.map((item) => item.category)}>
                                  {/* BAS-3241 Remove monthly label from dashboard */}
                                  {/* <ChartCategoryAxisTitle text="Monthly" /> */}
                                </ChartCategoryAxisItem>
                              </ChartCategoryAxis>

                              <ChartSeries>
                                {x.Include_Benchmark_Display === true && (
                                  <ChartSeriesItem
                                    color={'#FF6358'}
                                    type="column"
                                    spacing={0.25}
                                    data={x.barChartDataBench}
                                    tooltip={{
                                      visible: true,
                                      width: 120,
                                      position: 'center',
                                    }}
                                  />
                                )}
                                {/* {x.Include_Benchmark_Display === true && ( */}
                                <ChartSeriesItem
                                  color={'#FFD246'}
                                  type="column"
                                  data={x?.combine_dataset[1]?.data?.map((item) => item?.value)}
                                  tooltip={{
                                    visible: true,
                                    width: 120,
                                    position: 'center',
                                  }}
                                />
                                {/* )} */}
                              </ChartSeries>
                            </Chart>
                          ) : (
                            x.Display_Type === 'Text' && (
                              <>
                                {/* <ExcelExport ref={_export}> */}
                                <Grid
                                  style={{
                                    height: '320px',
                                  }}
                                  data={x.tableData}
                                  sortable={true}
                                  reorderable={true}
                                >
                                  <GridToolbar></GridToolbar>
                                  <GridColumn field="name" title="Category Name" />
                                  <GridColumn field="value2" title="Iteration data" />
                                  {x.Include_Benchmark_Display === true && <GridColumn field="value" title="Benchmark Data" />}
                                </Grid>
                                {/* </ExcelExport> */}
                              </>
                            )
                          )}
                        </div>
                      </div>
                      <div className={'card1 Route_Type_return1 h-100'}>
                        <div className={'row h-100 pl-2 pr-2 ' + (x.isAddSelected === false && ' disabled')}>
                          <div className="col-sm-12 col-md-12 col-lg-12 d-flex align-items-center">
                            {/* <img src={PrevMonthIcon} className="icon-default-size2  mr-3 ml-4" alt="NextMonthIcon" onClick={() => prevMonth(x, index)} /> */}

                            {/* {x.Interval_Step === 'Day' &&  */}
                            <img
                              src={prevIterationIcon}
                              className="icon-default-size2  mr-4"
                              alt="prevIterationIcon"
                              style={{
                                opacity: disablePreviousButton?.isDisable === true && x?.Card_Id === disablePreviousButton.cardId ? '0.5' : '1',
                                pointerEvents: disablePreviousButton?.isDisable === true && x?.Card_Id === disablePreviousButton.cardId ? 'none' : 'auto',
                              }}
                              onClick={() => prevDay(x, index)}
                              data-testid={`prev-iteration-icon-${index}`}
                            />
                            {/* start of prev interval icon */}
                            <img
                              src={PrevDayIcon}
                              className="icon-default-size2  mr-4"
                              alt="PrevDayIcon"
                              style={{
                                opacity:
                                  (disablePreviousButton?.isDisable === true && x.Card_Id === disablePreviousButton?.cardId) ||
                                  x.Interval === '' ||
                                  x.Interval === null ||
                                  x.Interval === undefined
                                    ? '0.5'
                                    : '1',
                                pointerEvents:
                                  (disablePreviousButton?.isDisable === true && x.Card_Id === disablePreviousButton?.cardId) ||
                                  x.Interval === '' ||
                                  x.Interval === null ||
                                  x.Interval === undefined
                                    ? 'none'
                                    : 'auto',
                              }}
                              onClick={() => prevInterval(x, index)}
                              data-testid={`prev-day-icon-${index}`}
                            />
                            {/* end of prev interval icon */}
                            {/* } */}

                            <span className="text-center w-100">
                              <b>{x.Iteration_DTTM ? moment(x.Iteration_DTTM)?.format('MMM DD YYYY , h:mm a') : ''}</b>
                            </span>
                            {/* {x.Interval_Step === 'Day' && ( */}
                            <img
                              className="icon-default-size2 mr-3 ml-5"
                              src={nextDayIcon}
                              alt="nextDayIcon"
                              onClick={() => nextInterval(x, index)}
                              style={{
                                opacity:
                                  x.iterationNbr >= x.Max_Iteration_Nbr || (x.Interval === '' && x.Interval === null && x.Interval === undefined) || x.iterationNbr === undefined
                                    ? '0.5'
                                    : '1',
                                pointerEvents:
                                  x.iterationNbr >= x.Max_Iteration_Nbr || (x.Interval === '' && x.Interval === null && x.Interval === undefined) || x.iterationNbr === undefined
                                    ? 'none'
                                    : 'auto',
                              }}
                              data-testid={`next-day-icon-${index}`}
                            />
                            <img
                              className="icon-default-size2 mr-3 ml-5"
                              src={nextIterationIcon}
                              alt="nextIterationIcon"
                              style={{
                                opacity: x.iterationNbr >= x.Max_Iteration_Nbr || x.iterationNbr === undefined ? '0.5' : '1',
                                pointerEvents: x.iterationNbr >= x.Max_Iteration_Nbr || x.iterationNbr === undefined ? 'none' : 'auto',
                              }}
                              onClick={() => nextDay(x, index)}
                              data-testid={`next-iteration-icon-${index}`}
                            />
                            <img
                              src={ResetIcon}
                              className="icon-default-size2"
                              alt="resetIcon"
                              style={{
                                height: '20px',
                                opacity: x.iterationNbr === x.Max_Iteration_Nbr || x.iterationNbr === undefined ? '0.5' : '1',
                                pointerEvents: x.iterationNbr === x.Max_Iteration_Nbr || x.iterationNbr === undefined ? 'none' : 'auto',
                              }}
                              onClick={() => {
                                resetDate(x, index);
                              }}
                              data-testid={`reset-icon-${index}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Card Block End */}

            {/* Accordion Block Start */}
            <div className="container-fluid mt-4 accordion p-1 mb-4" data-testid="accordion-block">
              <div className="row">
                {dashboardData.map((obj3, idx) => {
                  return (
                    <div key={uuidv4()} className="col-sm-12 col-lg-12 col-md-12">
                      <div onClick={() => ArrowOpen(obj3)} className="cursor" data-testid={`accordion-toggle-${idx}`}>
                        <hr className="mx-2 mt-0" style={{ width: '100%', margin: '3px', height: '3px' }} />
                        <img src={caretDown} alt="caretDown" className="scan_base_icon mt-0" style={{ width: '10.63px', height: '17.5px' }} />

                        {obj3.isExpand ? (
                          <img
                            src={caretUp}
                            alt="caretUp"
                            className="scan_base_icon pointer relative"
                            style={{ width: '10.63px', height: '17.5px' }}
                            onClick={() => ArrowOpen(obj3)}
                          />
                        ) : (
                          // <i className="fa-solid fa-caret-down pointer relative" onClick={() => ArrowOpen(obj3)}></i>
                          <img
                            src={caretDown}
                            alt="caretDown"
                            className="scan_base_icon pointer relative"
                            style={{ width: '10.63px', height: '17.5px' }}
                            onClick={() => ArrowOpen(obj3)}
                          />
                        )}
                        <span className="mt-0 title-text">
                          <b>
                            Indicators {obj3.name} : {obj3.Collection7.length} items
                          </b>
                        </span>
                      </div>

                      {/* expanded block code start */}
                      {obj3.isExpand && (
                        <>
                          {/* Card Block Start */}
                          <div className="row">
                            {obj3.Collection7.map((x, index) => {
                              return (
                                <div key={uuidv4()} className="col-sm-12 col-md-6 col-lg-4 col-xxl-4 mt-3 mb-4 p-3 d-flex justify-content-between">
                                  <div className="card position-relative card-outer p-0" data-testid={`accordion-card-${index}`}>
                                    <div className={'header Route_Type_return1'}>
                                      <div className="row card-header-bar-outer">
                                        <div>
                                          <img src={chart} className="pie-chartIcon" alt="pie-chartIcon" />
                                        </div>
                                        <div>
                                          <span>
                                            <h5 className="mt-2 text-white text-center" key={uuidv4()} data-testid={`accordion-card-title-${index}`}>
                                              {x.Card_Display_Name}
                                            </h5>
                                          </span>
                                        </div>
                                        <div>
                                          {/* <img src={microscope} className="icon-default-size mr-3" alt="microscopeIcon" /> */}

                                          <React.Fragment>
                                            <button
                                              className="ml-3 px-3 my-1 btn btn-lg btn-outline-dark plusIcon"
                                              disabled={newCardsData.find((obj) => obj.Card_Id === x.Card_Id)}
                                              onClick={() => {
                                                // addToEmptyNewCardData(x); called inside below function to make it work as per api call
                                                updateUserPreference(x.Card_Id, x);
                                              }}
                                              data-testid={`accordion-add-button-${index}`}
                                            >
                                              {/* <i className="fa-solid fa-plus mt-2"></i> */}
                                              <img src={plusIcon} alt="plusIcon" className="scan_base_icon Categories" style={{ width: '10.94px', height: '13px' }} />
                                            </button>
                                          </React.Fragment>
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ color: 'black' }}>
                                      <div style={{ height: '400px' }}>
                                        {x.Display_Type === 'Donut' ? (
                                          (!!x.Iteration_DTTM || !!x.Card_Display_Name) && (
                                            <Chart transitions={false}>
                                              <ChartTitle text={x.Card_Description} />
                                              {x.Include_Benchmark_Display === true ? (
                                                <>
                                                  <ChartSeries>{x.combine_dataset.map(mapSeries)}</ChartSeries>
                                                  {/* Shown legends of only outer circle */}
                                                  <ChartLegend
                                                    position="right"
                                                    labels={{
                                                      template: (dataItem) => {
                                                        if (x.combine_dataset.length !== 0 && dataItem?.hasOwnProperty('dataItem')) {
                                                          const legendItem =
                                                            x.combine_dataset?.length > 1
                                                              ? x.combine_dataset[1]?.data
                                                                ? x.combine_dataset[1]?.data?.find(
                                                                    (item) => item.category === dataItem?.dataItem?.category && item.value === dataItem?.dataItem?.value
                                                                  )
                                                                : x.combine_dataset[0]?.data?.find(
                                                                    (item) => item.category === dataItem?.dataItem?.category && item.value === dataItem?.dataItem?.value
                                                                  )
                                                              : '';
                                                          return legendItem ? `${legendItem.category}` : '';
                                                        }
                                                      },
                                                    }}
                                                  />
                                                </>
                                              ) : (
                                                <ChartSeries>
                                                  {x.combine_dataset.length > 1 &&
                                                    x.combine_dataset.slice(1, 2).map((series) => (
                                                      <ChartSeriesItem
                                                        type="donut"
                                                        key={uuidv4()}
                                                        startAngle={150}
                                                        name={series.name}
                                                        data={series.data}
                                                        field="value"
                                                        categoryField="category"
                                                        colorField="color"
                                                        tooltip={{
                                                          visible: true,
                                                          render: renderTooltip,
                                                          width: 120,
                                                          position: 'center',
                                                        }}
                                                      ></ChartSeriesItem>
                                                    ))}
                                                </ChartSeries>
                                              )}
                                            </Chart>
                                          )
                                        ) : x.Display_Type === 'Line' ? (
                                          <Chart transitions={false}>
                                            <ChartTitle text={x.Card_Description} />
                                            <ChartCategoryAxis>
                                              <ChartCategoryAxisItem
                                                labels={{ rotation: 'auto' }}
                                                // BAS-3241 Remove monthly label from dashboard
                                                // title={{
                                                //   text: 'Monthly',
                                                // }}
                                                categories={x.Benchmark_Data[0].data.map((item) => item.category)}
                                              />
                                            </ChartCategoryAxis>
                                            <ChartSeries>
                                              {x.Include_Benchmark_Display === true && (
                                                <ChartSeriesItem
                                                  color={'#FF6358'}
                                                  tooltip={{
                                                    visible: true,
                                                    width: 120,
                                                    position: 'center',
                                                  }}
                                                  type="line"
                                                  data={x?.lineChartDataBench}
                                                />
                                              )}
                                              {/* {x.Include_Benchmark_Display === true && ( */}
                                              <ChartSeriesItem
                                                color={'#FFD246'}
                                                tooltip={{
                                                  visible: true,
                                                  width: 120,
                                                  position: 'center',
                                                }}
                                                type="line"
                                                data={x?.combine_dataset[1]?.data?.map((item) => item?.value)}
                                              />
                                              {/* )} */}
                                            </ChartSeries>
                                          </Chart>
                                        ) : x.Display_Type === 'Bar' ? (
                                          <Chart transitions={false}>
                                            <ChartTitle text={x.Card_Description} />
                                            <ChartCategoryAxis
                                            // BAS-3241 Remove monthly label from dashboard
                                            // title={{
                                            //   text: 'Monthly',
                                            // }}
                                            >
                                              <ChartCategoryAxisItem labels={{ rotation: 'auto' }} categories={x.Benchmark_Data[0].data.map((item) => item.category)}>
                                                {/* BAS-3241 Remove monthly label from dashboard */}
                                                {/* <ChartCategoryAxisTitle text="Monthly" /> */}
                                              </ChartCategoryAxisItem>
                                            </ChartCategoryAxis>

                                            <ChartSeries>
                                              {x.Include_Benchmark_Display === true && (
                                                <ChartSeriesItem
                                                  color={'#FF6358'}
                                                  type="column"
                                                  spacing={0.25}
                                                  data={x.barChartDataBench}
                                                  tooltip={{
                                                    visible: true,
                                                    width: 120,
                                                    position: 'center',
                                                  }}
                                                />
                                              )}
                                              {/* {x.Include_Benchmark_Display === true && ( */}
                                              <ChartSeriesItem
                                                color={'#FFD246'}
                                                type="column"
                                                data={x?.combine_dataset[1]?.data?.map((item) => item?.value)}
                                                tooltip={{
                                                  visible: true,
                                                  width: 120,
                                                  position: 'center',
                                                }}
                                              />
                                              {/* )} */}
                                            </ChartSeries>
                                          </Chart>
                                        ) : (
                                          x.Display_Type === 'Text' && (
                                            <>
                                              <Grid
                                                style={{
                                                  height: '320px',
                                                }}
                                                data={x.tableData}
                                                sortable={true}
                                                reorderable={true}
                                              >
                                                <GridToolbar></GridToolbar>
                                                <GridColumn field="name" title="Category Name" />
                                                <GridColumn field="value2" title="Iteration data" />
                                                {x.Include_Benchmark_Display === true && <GridColumn field="value" title="Benchmark Data" />}
                                              </Grid>
                                            </>
                                          )
                                        )}
                                      </div>
                                    </div>
                                    <div className={'card1 Route_Type_return1'}>
                                      <div className="row" style={{ padding: 5 }}>
                                        <div className="col-sm-12 col-md-12 col-lg-12 d-flex align-items-center">
                                          <img
                                            src={prevIterationIcon}
                                            className="icon-default-size2  mr-4"
                                            alt="prevIterationIcon"
                                            style={{
                                              opacity: disablePreviousAccordianButton.isDisable === true && disablePreviousAccordianButton.cardId === x.Card_Id ? '0.5' : '1',
                                              pointerEvents:
                                                disablePreviousAccordianButton.isDisable === true && disablePreviousAccordianButton.cardId === x.Card_Id ? 'none' : 'auto',
                                            }}
                                            onClick={() => prevDayAccordian(obj3, index)}
                                            data-testid={`prev-iteration-accordian-icon-${index}`}
                                          />
                                          {/* start of prev interval icon */}
                                          <img
                                            src={PrevDayIcon}
                                            className="icon-default-size2  mr-4"
                                            alt="PrevDayIcon"
                                            style={{
                                              opacity:
                                                (disablePreviousAccordianButton.isDisable === true && disablePreviousAccordianButton.cardId === x.Card_Id) ||
                                                x.Interval === '' ||
                                                x.Interval === null ||
                                                x.Interval === undefined
                                                  ? '0.5'
                                                  : '1',
                                              pointerEvents:
                                                (disablePreviousAccordianButton.isDisable === true && disablePreviousAccordianButton.cardId === x.Card_Id) ||
                                                x.Interval === '' ||
                                                x.Interval === null ||
                                                x.Interval === undefined
                                                  ? 'none'
                                                  : 'auto',
                                            }}
                                            onClick={() => prevIntervalAccordian(obj3, index)}
                                            data-testid={`prev-interval-accordian-icon-${index}`}
                                          />
                                          {/* end of prev interval icon */}

                                          <span className="text-center w-100">
                                            <b>{moment(x.Iteration_DTTM).format('MMM DD YYYY , h:mm a')}</b>
                                          </span>
                                          {/* start of next interval icon */}
                                          <img
                                            className="icon-default-size2 mr-3 ml-5"
                                            src={nextDayIcon}
                                            alt="nextDayIcon"
                                            onClick={() => nextIntervalAccordian(obj3, index)}
                                            style={{
                                              opacity: x.iterationNbr >= x.Max_Iteration_Nbr || x.iterationNbr === undefined ? '0.5' : '1',
                                              pointerEvents: x.iterationNbr >= x.Max_Iteration_Nbr || x.iterationNbr === undefined ? 'none' : 'auto',
                                            }}
                                            data-testid={`next-interval-accordian-icon-${index}`}
                                          />
                                          {/* end of next interval icon */}
                                          <img
                                            className="icon-default-size2 mr-3 ml-5"
                                            src={nextIterationIcon}
                                            alt="nextIterationIcon"
                                            onClick={() => nextDayAccordian(obj3, index)}
                                            style={{
                                              opacity: x.iterationNbr >= x.Max_Iteration_Nbr || x.iterationNbr === undefined ? '0.5' : '1',
                                              pointerEvents: x.iterationNbr >= x.Max_Iteration_Nbr || x.iterationNbr === undefined ? 'none' : 'auto',
                                            }}
                                            data-testid={`next-iteration-accordian-icon-${index}`}
                                          />
                                          <img
                                            src={ResetIcon}
                                            className="icon-default-size2"
                                            style={{
                                              height: '20px',
                                              opacity: x.iterationNbr === x.Max_Iteration_Nbr || x.iterationNbr === undefined ? '0.5' : '1',
                                              pointerEvents: x.iterationNbr === x.Max_Iteration_Nbr || x.iterationNbr === undefined ? 'none' : 'auto',
                                            }}
                                            alt="resetIcon"
                                            onClick={() => {
                                              resetDateAccordian(obj3, index);
                                            }}
                                            data-testid={`reset-accordian-icon-${index}`}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Card Block End */}
                        </>
                      )}
                      {/* expanded block code end */}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Accordion Block End */}
          </div>
        </>
      )}
    </main>
  );
};

const TableKendo = ({ Grid, GridColumn, GridToolbar, ExcelExport, products }) => {
  const _export = useRef(null);

  const exportExport = () => {
    if (_export.current !== null) {
      _export.current.save(products);
    }
  };
  return (
    <>
      <ExcelExport ref={_export}>
        <Grid
          style={{
            height: '320px',
          }}
          data={products}
          sortable={true}
          reorderable={true}
        >
          <GridToolbar>
            <button title="Export Excel" className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary" onClick={exportExport}>
              Export to Excel
            </button>
            <br />
          </GridToolbar>
          <GridColumn field="category" title="Category Name" />
          <GridColumn field="value" title="Value" />
        </Grid>
      </ExcelExport>
    </>
  );
};

export default Dashboard;
