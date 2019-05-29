$(function() {
  var menuStatus = false;

  $(".menu-button").click(function() {
    toggleMenu();
  });

  $(window).scroll(function() {
    if (menuStatus) {
      toggleMenu();
    }
  });

  $('.pelicula').click(function() {
    if (menuStatus) {
      toggleMenu();
    }
  });

  function toggleMenu() {
    $('.menu').stop();
    $('.menu').clearQueue();
    $('.pelicula').stop();
    $('.pelicula').clearQueue();

    if (menuStatus) {
      $(".menu").animate({
        left: -350
      }, 200);

      $('.pelicula').fadeOut("fast");

      menuStatus = false;
    }

    else {
      $(".menu").animate({
        left: 0
      }, 200);

      $('.pelicula').fadeIn("fast");

      menuStatus = true;
    }
  }

  $(window).resize(function () {
    if (menuStatus) {
      toggleMenu();
    }
  });

  $('.svg').svgInject();

  var filterParams = {
    years: {
      first: 0,
      last: 0
    },
    campis: [],
    situations: [],
    areas: []
  }

  var charts = createCharts();

  var years = new Array();
  var seachers = new Array();
  for (var i = 2014; i <= new Date().getFullYear(); i++) {
    years.push({
      year: i,
      quantity: 0
    });

    seachers.push({
      year: i,
      quantity: 0
    });

    charts['chartByYear'].data.labels.push(i);
    charts['chartByYear'].update();

    charts['chartBySearcher'].data.labels.push(i);
    charts['chartBySearcher'].update();
  }

  filterParams.years.first = years[0];
  filterParams.years.last = years[years.length];

  var campis = new Array();
  $.getJSON("assets/json/campis.json", function(data) {
    campis = data.campis;

    for (var i = 0; i < campis.length; i++) {
      filterParams.campis.push(campis[i].sigla);

      charts['chartByCampus'].data.labels.push(campis[i].nome);
      charts['chartByCampus'].data.datasets[0].backgroundColor.push(campis[i].color);

      $('.campus-chips').append("<p id='"+ campis[i].sigla +"'>"+ campis[i].sigla +"</p> ");
    }
    charts['chartByCampus'].update();
  });

  var areas = new Array();
  $.getJSON("assets/json/areas.json", function(data) {
     areas = data.areas;

     for (var i = 0; i < areas.length; i++) {
       charts['chartByArea'].data.datasets.push({
         data: areas[i].quantity,
         label: areas[i].name,
         backgroundColor: areas[i].color
       });

       var prettyCheckbox = $('<div class="pretty p-default"></div');
       var checkboxPre = $('<input type="checkbox" checked/>');
       $(checkboxPre).attr("id", makeLowerCase(areas[i].name));
       prettyCheckbox.append(checkboxPre);
       var containerLabelCheckbox = $('<div class="state p-primary"></div>');
       containerLabelCheckbox.append($('<label>'+ areas[i].name +'</label>'));
       prettyCheckbox.append(containerLabelCheckbox);
       $('.areas-select').append(prettyCheckbox);

       filterParams.areas.push(makeLowerCase(areas[i].name));
     }
     charts['chartByArea'].update();
  });

  var firstValues = new Array();
  $.getJSON("assets/json/first-values.json", function(data) {
     firstValues = data.firstValues;

     $('.send').attr("id", "send");
     filterParams.situations[0] = "send";
     for (var i = 0; i < firstValues.length; i++) {
       $('.' + firstValues[i].name).attr("id", firstValues[i].situation);
       filterParams.situations.push(firstValues[i].situation);
     }
  });

  $.getJSON("https://dados.ifrn.edu.br/dataset/5016ec85-74a6-4f56-a3f0-e93e69196150/resource/68a1125a-4b28-4ad5-9581-0018096d39bb/download/dados_extraidos_recursos_projetos-de-pesquisa.data", function(data) {
    configureYearFilter(data);
    configureCampusFilter(data);
    configureInitialFilter(data);
    configureAreaFilter(data);

    $('.spinner').hide();
    $('.filter').show();
  });

  function filter(data) {
    var newData = new Array();

    for (var i = 0; i < data.length; i++) {
      var year = new Date(data[i]['inicio_execucao']).getFullYear();

      if (data[i].situacao != "Não Enviado") {
        if (year >= filterParams.years.first && year <= filterParams.years.last) {
          if (filterParams.campis.includes(data[i].campus)) {
            if (!filterParams.situations.includes('send')) {
              break
            }

            else if (!filterParams.situations.includes("Não selecionado")) {
              if (data[i].situacao != "Não selecionado") {
                continue;
              }
            }

            else if (!filterParams.areas.includes(makeLowerCase(data[i].area_conhecimento))) {
              continue;
            }

            else if (!filterParams.situations.includes(data[i].situacao)) {
              continue;
            }

            newData.push(data[i]);
          }
        }
      }
    }

    console.log(filterParams.areas);

    change(newData);
  }

  function change(data) {
    // console.log(data);
    $('.send h2').html(data.length);

    for (var i = 0; i < firstValues.length; i++) {
      firstValues[i].quantity = 0;
    }

    for (var i = 0; i < areas.length; i++) {
      areas[i].quantity = 0;
    }

    for (var i = 0; i < years.length; i++) {
      years[i].quantity = 0;
      seachers[i].quantity = 0;
    }

    for (var i = 0; i < campis.length; i++) {
      campis[i].quantity = 0;
    }

    for (var i = 0; i < data.length; i++) {
      if (includesIn(firstValues, 'situation', data[i]['situacao']) !== false) {
        firstValues[includesIn(firstValues, 'situation', data[i]['situacao'])].quantity++;
      }

      if (includesIn(areas, 'name', data[i]['area_conhecimento']) !== false) {
        areas[includesIn(areas, 'name', data[i]['area_conhecimento'])].quantity++;
      }

      var year = new Date(data[i]['inicio_execucao']).getFullYear();
      if (includesIn(years, "year", Number(year)) !== false) {
        years[includesIn(years, "year", Number(year))].quantity++;

        seachers[includesIn(seachers, "year", Number(year))].quantity += data[i].equipe.split(',').length;
      }

      if (includesIn(campis, 'sigla', data[i]['campus']) !== false) {
        campis[includesIn(campis, 'sigla', data[i]['campus'])].quantity++;
      }
    }

    firstValues[0].quantity = data.length - firstValues[0].quantity;

    for (var i = 0; i < firstValues.length; i++) {
      $('.' + firstValues[i].name + ' h2').html(firstValues[i].quantity);
    }

    for (var i = 0; i < areas.length; i++) {
      charts['chartByArea'].data.datasets[i].data = [];
      charts['chartByArea'].data.datasets[i].data.push(areas[i].quantity);
    }
    charts['chartByArea'].update();

    charts['chartByYear'].data.datasets[0].data = [];
    for (var i = filterParams.years.first; i <= filterParams.years.last; i++) {
      charts['chartByYear'].data.datasets[0].data.push(years[includesIn(years, "year", i)].quantity);
    }
    charts['chartByYear'].update();

    charts['chartByCampus'].data.datasets[0].data = [];
    for (var i = 0; i < campis.length; i++) {
      charts['chartByCampus'].data.datasets[0].data.push(campis[i].quantity);
    }
    charts['chartByCampus'].update();

    charts['chartBySearcher'].data.datasets[0].data = [];
    for (var i = filterParams.years.first; i <= filterParams.years.last; i++) {
      charts['chartBySearcher'].data.datasets[0].data.push(seachers[includesIn(seachers, "year", i)].quantity);
    }
    charts['chartBySearcher'].update();
  }

  function createCharts() {
    var charts = new Array();

    charts['chartByArea'] = new Chart(document.getElementById("chart-by-area").getContext('2d'), {
        type: 'bar',
        data: {
          datasets: []
        },
        options: {
          maintainAspectRatio: false,
          legend: {
              position: "bottom"
          },
          scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
          }
        }
    });

    charts['chartByYear'] = new Chart(document.getElementById("chart-by-year").getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                lineTension: 0,
                backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
        },
        options: {
          legend: {
              display: false
          },
          bezierCurve: false,
          maintainAspectRatio: false,
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }],
              xAxes: [{
                ticks: {
                  fontSize: 9,
                  autoSkip: false
                }
              }]
          }
        }
    });

    charts['chartByCampus'] = new Chart(document.getElementById("chart-by-campus").getContext('2d'), {
        type: 'pie',
        data: {
          labels: [],
          datasets: [{
            backgroundColor: []
          }]
        },
        options: {
          legend: {
              position: "bottom"
          },
          maintainAspectRatio: false
        }
    });

    charts['chartBySearcher'] = new Chart(document.getElementById("chart-by-searcher").getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                lineTension: 0,
                fill: true,
                backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
        },
        options: {
          legend: {
              display: false
          },
          bezierCurve: false,
          maintainAspectRatio: false,
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }],
              xAxes: [{
                ticks: {
                  fontSize: 9,
                  autoSkip: false
                }
              }]
          }
        }
    });

    return charts;
  }

  function configureYearFilter(data) {
    var rangeSlider = document.getElementById('slider-range');

    noUiSlider.create(rangeSlider, {
      start: [years[0].year, years[years.length - 1].year],
      step: 1,
      format: wNumb({
        decimals: 0
      }),
      range: {
        'min': [years[0].year],
        'max': [years[years.length - 1].year]
      },
      connect: true
    });

    rangeSlider.noUiSlider.on('update', function(values, handle) {
      if (values[0] == values[1]) {
        $('#year').html(values[0]);
      }

      else {
        $('#year').html(values[0] + ' até ' + values[1]);
      }

      charts['chartByYear'].data.labels = [];
      charts['chartBySearcher'].data.labels = [];
      for (var i = values[0]; i <= values[1]; i++) {
        charts['chartByYear'].data.labels.push(i);
        charts['chartByYear'].update();

        charts['chartBySearcher'].data.labels.push(i);
        charts['chartBySearcher'].update();
      }

      filterParams.years.first = values[0];
      filterParams.years.last = values[1];

      filter(data);
    });
  }

  function configureCampusFilter(data) {
    $('.campus-chips p').click(function() {
      if (!$(this).is('#all')) {
        if ($(this).hasClass('disable')) {
          $(this).removeAttr('class');
          filterParams.campis.push(this.innerHTML);
        }
  
        else {
          $(this).addClass('disable');
          filterParams.campis.splice(filterParams.campis.indexOf(this.innerHTML), 1);
        }
      }

      else {
        if ($(this).hasClass('disable')) {
          $('.campus-chips p').removeAttr('class');
          filterParams.campis = [];

          $('.campus-chips p').each(function(index) {
            if (!$(this).is('#all')) {
              filterParams.campis.push(this.innerHTML);
            }
          });
        }
  
        else {
          $('.campus-chips p').addClass('disable');
          filterParams.campis = [];
        }
      }

      if (filterParams.campis.length < $('.campus-chips p').length - 1) {
        $('#all').addClass('disable');
      }

      else {
        $('#all').removeAttr('class');
      }

      console.log(filterParams.campis);

      filter(data);
    });
  }

  function configureInitialFilter(data) {
    $('.numbers > div').click(function() {
      if ($(this).css("background-color") == "rgb(230, 230, 230)") {
        $(this).css("background-color", "white");
        $(this).find('path').removeAttr('style');
        filterParams.situations.push(this.id);
      }

      else {
        $(this).css("background-color", "#e6e6e6");
        $(this).find('path').css("fill", "gray");
        filterParams.situations.splice(filterParams.situations.indexOf(this.id), 1);
      }

      filter(data);
    });
  }

  function configureAreaFilter(data) {
    $('.pretty input').click(function() {
      console.log(filterParams.areas.indexOf(this.id));
      if ($(this).is(':checked')) {
        filterParams.areas.push(this.id);
      }
      else {
        filterParams.areas.splice(filterParams.areas.indexOf(this.id), 1);
      }

      console.log(filterParams.areas);

      filter(data);
    });
  }

  function includesIn(objects, key, value) {
    for (var i = 0; i < objects.length; i++) {
      if (makeLowerCase(objects[i][key]) === makeLowerCase(value)) {
        return i;
      }
    }

    return false;
  }

  function makeLowerCase(value) {
    return value.toString().toLowerCase();
  }
});
