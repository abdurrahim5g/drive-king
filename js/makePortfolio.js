let num_active_products = 0;
let num_inactive_products = 0;
let selectedType = "";

function parseCSVToCallback(file, callback, portfolio, detail_data, isDetail = false) {
	// This reads in CSV and then calls the callback function to process it
	Papa.parse(file, {
		download: true,
		header:true,
		skipEmptyLines:true,
		delimiter:",",
		complete: function(results) {
			if (isDetail)
				callback(results.data, portfolio, detail_data);
			else 
            	callback(results.data, portfolio);
		}
	});
}

/*
 * function name: parseCSVToCallbackUpdate 
 * parameter: file
 *          : portfolio => "Sepsis", "ENACT", ...
 *          : flagShowActive => flag to show whether showing active/inactive or all
 * description: read portfolio data from CSVs and call makeGallery function
 * return null
 * date Nov 26th 2020
 */
function parseCSVToCallbackUpdate(file, portfolio, flagShowActive = true) {
	// This reads in CSV and then calls the callback function to process it
	flagShowActive
	? parseCSVToCallback(file, makeGallery, portfolio)
	: parseCSVToCallback(file, makeGalleryNoActive, portfolio);
	Papa.parse("map/data/product-active.csv", {
		download: true,
		header:true,
		skipEmptyLines:true,
		delimiter:",",
		complete: function(results) {
			renderGalleryFilters(results.data);
		}});
}

/*
 * function name: parseCSVToCallbackUpdate 
 * parameter: file
 *          : portfolio => "Sepsis", "ENACT", ...
 *          : flagShowActive => flag to show whether showing active/inactive or all
 * description: read portfolio data from CSVs and call makeGallery function
 * return null
 * date Mar 25th 2021
 */
function parseCSVToCallbackForDetail(file, portfolio, type, id) {   // portfolio = "Sepsis", "ENACT"
	// This reads in CSV and then calls the callback function to process it
	parseCSVToCallback(file, makePortfolioDetail, portfolio, { type, id }, true);
}

/*
 * function name: parseCSVsForFilter 
 * parameter: null
 * description: read filter data from CSVs and call renderMenuFilter function
 * return null
 * date Nov 26th 2020
 */
function parseCSVsForFilter() {
	// d3.queue()
	// 	.defer(d3.csv, "map/data/product-types.csv")
	// 	.defer(d3.csv, "map/data/impact-areas.csv")
	// 	.defer(d3.csv, "map/data/technology-levels.csv")
	// 	.defer(d3.csv, "map/data/countries.csv")
	// 	.await(renderMenuFilter);

	parseCSVToCallback("map/data/product-types.csv", makeMenuFilter, 'menudrop-product-type-drop-down');
	parseCSVToCallback("map/data/impact-areas.csv", makeMenuFilter, 'menudrop-impact-area-drop-down');
	parseCSVToCallback("map/data/technology-levels.csv", makeMenuFilter, 'menudrop-technology-level-drop-down');
	parseCSVToCallback("map/data/countries.csv", makeMenuFilter, 'menudrop-country-drop-down');
}

// Make the overall gallery
function makeGallery(data, portfolio) {
	if (portfolio != "All") {
		data = data.filter(function(value, index, arr){
			return value.ImpactArea == portfolio;
		});
	}

	data.sort(function(a, b) {
        return (d3.ascending(a.ProductName, b.ProductName));
    });

	// data.sort(function(a, b) {
    //     return (d3.ascending(a.Name + a.ProductName, b.Name + b.ProductName));
    // });

    // data.sort(function(a, b) {
    //     return (d3.descending(getDateNumber(a.AwardEndDate), getDateNumber(b.AwardEndDate)));
    // });

	let products = calcActiveInActiveProduct(data);
	
	var output = "<div class='row equal'>";
	products.forEach((item, index) => {
		if (index == 1) {
            output += "<div class='seperate'></div>";
        }
        output += "<div class='col-12 productbox type " + (index == 0 ? "product-active-Y" : "product-active-N") + "'> <h2 class='type awards'>" + (index == 0 ? "Active Awards" : "Inactive Awards") + " </h2> </div>";
        if (item.length == 0) {
            output += "<div class=''><p class='no-data'>No data</p></div>";
        }
		item.forEach((d, key) => {
			var site = d.Website ? "<div class='tipfield'><span class='tiplabel'>Web: </span><a href='" + d.Website + "' target='_blank' onclick='return confirmExit()'>" + d.Website + "</a></div>" : '';

			var contact = d.Contact ? "<div class='tipfield'><span class='tiplabel'>Contact: </span> <a href='mailto:" + d.Contact + "'>" + 
					d.Contact + "</a></div>" : '';

			var funding = d.Funding ? "<div class='tipfield'><p><span class='tiplabel'>DRIVe Funding: </span>" + "$" + numberWithCommas(d.Funding) + "</p></div>" : '';
			
			var stage = d.Stage ? "<div class='tipfield'><p><span class='tiplabel'>Development: </span>" + d.Stage + "</p></div>" : '';
			
			var awardDate = d.AwardDate ? "<div class='tipfield'><p><span class='tiplabel'>Award Date: </span>" + d.AwardDate + "</p></div>" : '';
			
			var productName = d.ProductName ? "<div class='tipfield'><p><span class='tiplabel'>Product: </span> <span style='color:#000000; font-weight:bold;'>" + 
				d.ProductName +"</span></p></div>" : '';

			var projectName = d.ProjectName ? "<div class='tipfield'><p><span class='tiplabel'>Project: </span> <span style='color:#B36500; font-weight:bold;'>" + 
				d.ProjectName +"</span></p></div>" : '';
			
			var description = d.Description ? "<div class='tipfield'><p><span class='tiplabel'>Product Description: </span><span class='capes'>" + d.Description + "</span></p></div>" : '';

			var disruption = d.Disruption ? "<div class='tipfield'><p><span class='tiplabel'>Disruptive Innovation: </span><span class='capes'>" + d.Disruption + "</span></p></div>" : '';
			
			var location = "<div class='tipfield'><span class='tiplabel'>Location: </span>" + 
						(d.City ? d.City + ", " : '') + 
						(d.State ? d.State + ", " : '') + 
						(d.Country ? d.Country : '') + "</div>";
					
			var impactArea = d.ImpactArea ? "<div class='tipfield'><p><span class='tiplabel'>Impact Area: </span>" + d.ImpactArea + "</p></div>" : '';
			
			var costShare = d.CostShare ? "<div class='tipfield'><p><span class='tiplabel'>Cost Share: </span>" + "$" + numberWithCommas(d.CostShare) + "</p></div>" : '';
			
			var productType = d.ProductType ? "<div class='tipfield'><p><span class='tiplabel'>Deliverable Type: </span>" + d.ProductType + "</p></div>" : '';
			
			String.prototype.replaceAll = function (find, replace) {
								var str = this;
								return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
							};
			
			var productTarget = "link" + d.Name + d.ProductName
			productTarget = productTarget.replaceAll(" ", "-");
			productTarget = productTarget.replaceAll(",", "-");
			
			var classProductType = "product-type-" + d.ProductType.replaceAll(" ", "_").replace('/', '_');
			var classCountry = "product-country-" + d.Country.replaceAll(" ", "_");
			var classImpactArea = "product-impact-area-" + d.ImpactArea.replaceAll(" ", "_");
			var classTRL = "product-TRL-" + d.Stage.replace(/^(TRL )?([^ ]+)/, '$2');
			var classProductActive = "product-active-" + d.Active;
			
			var tipimg = d.logofile ? "<img class='gallerylogos' src='map/images/ProductLogos/" + d.logofile + "' width='90%' alt='" + d.Name + "' style='padding:0px;'/>" : "";
			output = output + "<div class='col-xs-12 col-sm-6 col-md-4 col-lg-4 productbox " + 
				classProductType + " " + classCountry + " " + classImpactArea + " " + classProductActive + " " + classTRL + "' style='position: relative; vertical-align: middle;'>" + 
				"<div class='product-content'><div class='image-area'>" +				
				tipimg + "</div><p class='text-center' style='font-size: 20px; color:#B36500;'><b>" + d.ProductName + "</b></p>" + 
				"<p style='text-align: start;'>Company: <span class='galleryproductname'><b>" + d.Name + "</b></span></p>" +
				"<div class='ellipsis'>" +				
				"<p style='text-align: start; margin-bottom: 0px;'>" + d.Description + "</p></div>" + "<div><a href='" + d.Website + "' target='_blank' onclick='return confirmExit()'><span>" + d.Website + "</span></a></div>" +
				// "<p class='galleryproductname'>" + d.ProductName + "</p>"+
				"</div>" + 
				// "<a data-toggle='modal' data-target='#-" + productTarget + "' href='portfolio.html?id=" + index + "' style='color:#000000;'>" + 
				"<a href='portfolio.html?id=" + key + "&type=" + (d.Active == "Y" ? 0 : 1) + "&p=" + portfolio + "' style='color:#000000;' target='_blank'>" + 
				"<p class='full-profile'>READ MORE</p>" +
				"</a><div class='shadow-container'><div class='shadow portfolios'></div></div></div>";
								
			// Modal section
			output = output + 
				"<div class='modal fade' id='" + productTarget + "' role='dialog'><div class='modal-dialog modal-lg'>" +
				"<div class='modal-content' style='font-size: 20px;'><div class='modal-header'>" +
				tipimg + 
				"</div><div class='modal-body'>" +
				"<div class='tipContainer'><div class='tipFirst'><p style='color:#EE6352; font-size:200%;'><b>" + d.Name + "</b></p></div>"  +
				"<p>" +
				location +
				site +
				contact +
				"<p style='margin: 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 3px; padding-left: 10px; margin-top:30px; margin-bottom:30px; font-size:150%; font-weight:bold; color:#B36500;'>" + d.ProductName + "</p>" +

				// productName +
				description +
				productType +
				disruption +
				stage +
				funding +
				costShare +
				awardDate +
				"</div>" + // Tipcontainer
				"</div><div class='modal-footer'><button type='button' class='btn btn-default' data-dismiss='modal'>Close</button></div></div></div></div>" +
				"\n\n";
		});
	});
	//console.log(output);
	// Close the row
	output = output + "</div>";
	
	$('#gallery-content').html(output);
}

function makePortfolioDetail(data, portfolio, detail_data) {
	const productListDisplay = [];
	if (portfolio != "All") {
		data = data.filter(function(value, index, arr){
			return value.ImpactArea == portfolio;
		});
	}

	data.sort(function(a, b) {
        return (d3.ascending(a.ProductName, b.ProductName));
    });

	let allProducts = updatedCalcActiveInActiveProduct(data);

	let group = data.reduce((r, a) => {
        r[a.Name] = [...r[a.Name] || [], a];
        return r;
    }, {});

    for (const [key, item] of Object.entries(group)) {
        item[0].impactAreas = [];
        item.map(dup => {
            item[0].impactAreas.push(dup.ImpactArea);
        })
        productListDisplay.push(item[0]);
    }

	let dataList = allProducts.filter(item => item.Name == productListDisplay[detail_data.id].Name);
	dataList.sort((a, b) => d3.descending(a.Active, b.Active));

	var output = "";

	var companyData = dataList[0];
	var location = "<div class='tipfield' style='text-align: right'><span class='tiplabel'>Location: </span>" + 
		(companyData.City ? companyData.City + ", " : '') + 
		(companyData.State ? companyData.State + ", " : '') + 
		(companyData.Country ? companyData.Country : '') + "</div>";
	var site = companyData.Website ? "<div class='tipfield' style='text-align: right'><span class='tiplabel' style='font-size: 20px;'>Web: </span><a href='" + companyData.Website + "' target='_blank' onclick='return confirmExit()'>" + companyData.Website + "</a></div>" : '';
	output = output + 
		"<div class='tipFirst' style='text-align: center'><p style='font-size:200%;'><b>" + companyData.Name + "</b></p></div>"  +
		location +
		site;

	dataList.map((d, index) => {
		var funding = d.Funding ? "<div class='tipfield'><p><span class='tiplabel'>DRIVe Funding: </span>" + "$" + numberWithCommas(d.Funding) + "</p></div>" : '';
		
		var stage = d.Stage ? "<div class='tipfield'><p><span class='tiplabel'>Development Stage at Award: </span>" + d.Stage + "</p></div>" : '';
		
		var awardDate = d.AwardDate ? "<div class='tipfield'><p><span class='tiplabel'>Award Date: </span>" + d.AwardDate + "</p></div>" : '';
		
		var productName = d.ProductName ? "<div class='tipfield'><p><span class='tiplabel'>Product Name: </span>" + d.ProductName + "</p></div>" : '';
		
		var description = d.Description ? "<div class='tipfield'><p><span class='tiplabel'>Project Description: </span><span class='capes'>" + d.Description + "</span></p></div>" : '';

		var disruption = d.Disruption ? "<div class='tipfield'><p><span class='tiplabel'>Disruptive Innovation: </span><span class='capes'>" + d.Disruption + "</span></p></div>" : '';
		
		var impactArea = d.ImpactArea ? "<div class='tipfield'><p><span class='tiplabel'>Program: </span>" + d.ImpactArea + "</p></div>" : '';
		
		var costShare = d.CostShare ? "<div class='tipfield'><p><span class='tiplabel'>Cost Share: </span>" + "$" + numberWithCommas(d.CostShare) + "</p></div>" : '';
		
		var productType = d.ProductType ? "<div class='tipfield'><p><span class='tiplabel'>Product Type: </span>" + d.ProductType + "</p></div>" : '';
		
		String.prototype.replaceAll = function (find, replace) {
							var str = this;
							return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
						};
		
		var productTarget = "link" + d.Name + d.ProductName
		productTarget = productTarget.replaceAll(" ", "-");
		productTarget = productTarget.replaceAll(",", "-");
		
		var tipimg = d.logofile ? "<img class='logo' src='map/images/ProductLogos/" + d.logofile + "' alt='" + d.Name + "' style='width: 100%'/>" : "";
		// Modal section
		output = output + 
			(index != 0 ? "<div class='separate-div'></div>" : "<div></div>")+ 
			"<p class='name_text'>" + d.ProjectName + "</p>" +
			// productName +
			awardDate +
			productName +
			impactArea +
			(d.Active == "Y" ? "<p class='green-text'>Active</p>" : "<p class='red-text'>Inactive</p>") +
			description +
			disruption +
			productType +
			stage +
			funding +
			costShare +
			"</div>"; // Tipcontainer
	});
	// $(".home-banner-heading").html(tipimg);
	$('.tipContainer').html(output);
}

// not use
function makeGalleryNoActive(data, portfolio) {
	const today = new Date();
	const todayNumber = (today.getFullYear() * 100 + today.getMonth() + 1) * 100 + today.getDate();   // 02/12/2020 => 20200212
	// data.sort(function(a, b) {
    //     return (d3.ascending(a.Name + a.ProductName, b.Name + b.ProductName));
    // });

    // data.sort(function(a, b) {
    //     return (d3.descending(getDateNumber(a.AwardEndDate), getDateNumber(b.AwardEndDate)));
    // });
	data.sort(function(a, b) {
        return (d3.ascending(a.ProductName, b.ProductName));
    });
	let products = calcActiveInActiveProduct(data);
	
	var output = "<div class='row equal'>";
    products.forEach(function(item) {
		item.forEach(function(d) {
			var site = d.Website ? "<div class='tipfield'><span class='tiplabel' style='font-size: 20px;'>Web: </span><a href='" + d.Website + "' target='_blank' onclick='return confirmExit()'>" + d.Website + "</a></div>" : '';

			var contact = d.Contact ? "<div class='tipfield'><span class='tiplabel'>Contact: </span> <a href='mailto:" + d.Contact + "'>" + 
					d.Contact + "</a></div>" : '';

			var funding = d.Funding ? "<div class='tipfield'><p><span class='tiplabel'>Funding: </span>" + "$" + numberWithCommas(d.Funding) + "</p></div>" : '';
			
			var stage = d.Stage ? "<div class='tipfield'><p><span class='tiplabel'>Development: </span>" + d.Stage + "</p></div>" : '';
			
			var awardDate = d.AwardDate ? "<div class='tipfield'><p><span class='tiplabel'>Award Date: </span>" + d.AwardDate + "</p></div>" : '';
			
			var productName = d.ProductName ? "<div class='tipfield'><p><span class='tiplabel'>Product: </span> <span style='color:#B36500; font-weight:bold;'>" + 
				d.ProductName +"</span></p></div>" : '';
			
			var description = d.Description ? "<div class='tipfield'><p><span class='tiplabel'>Product Description: </span><span class='capes'>" + d.Description + "</span></p></div>" : '';

			var disruption = d.Disruption ? "<div class='tipfield'><p><span class='tiplabel'>Disruptive Innovation: </span><span class='capes'>" + d.Disruption + "</span></p></div>" : '';
			
			var location = "<div class='tipfield'><span class='tiplabel'>Location: </span>" + 
						(d.City ? d.City + ", " : '') + 
						(d.State ? d.State + ", " : '') + 
						(d.Country ? d.Country : '') + "</div>";
					
			var impactArea = d.ImpactArea ? "<div class='tipfield'><p><span class='tiplabel'>Impact Area: </span>" + d.ImpactArea + "</p></div>" : '';
			
			var costShare = d.CostShare ? "<div class='tipfield'><p><span class='tiplabel'>Cost Share: </span>" + "$" + numberWithCommas(d.CostShare) + "</p></div>" : '';
			
			var productType = d.ProductType ? "<div class='tipfield'><p><span class='tiplabel'>Product Type: </span>" + d.ProductType + "</p></div>" : '';
			
			String.prototype.replaceAll = function (find, replace) {
								var str = this;
								return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
							};
			
			var productTarget = "link" + d.Name + d.ProductName
			productTarget = productTarget.replaceAll(" ", "-");
			productTarget = productTarget.replaceAll(",", "-");
			
			var classProductType = "product-type-" + d.ProductType.replaceAll(" ", "_").replace('/', '_');
			var classCountry = "product-country-" + d.Country.replaceAll(" ", "_");
			var classImpactArea = "product-impact-area-" + d.ImpactArea.replaceAll(" ", "_");
			var classTRL = "product-TRL-" + d.Stage.replace(/^(TRL )?([^ ]+)/, '$2');
			var awardEndDate = getDateNumber(d.AwardEndDate);  //02/12/20 => 20200212
			var classProductActive = (d.Active == "Y") ? "mt-overlay-1 mt-scroll-center active-product product-item " : "mt-overlay-1 mt-scroll-center product-item inactive-gray "; 

			var tipimg = d.logofile ? "<img class='gallerylogos' src='map/images/ProductLogos/" + d.logofile + "' width='90%' alt='" + d.Name + "' style='padding:20px;'/>" : "";
			output = output + "<div class='col-xs-12 col-sm-4 col-md-3 col-lg-3 col-xl-3 productbox " + 
				classProductType + " " + classCountry + " " + classImpactArea + " " + classProductActive + " " + classTRL + "' style='position: relative; vertical-align: middle;'>" + 
				"<a data-toggle='modal' data-target='#" + productTarget + "' href='#' style='color:#000000;'>" + 
				"<div class='product-content'>" +
				tipimg + //"<p class='text-center' style='color:#B36500; padding-bottom:20px'><b>" + d.ProductName + "</b></p>" + 
				//"<p style='padding-bottom: 20px'>" + d.Description + "</p>" +
				"<p class='galleryproductname'>" + d.ProductName + "</p>"+
				"</div>" +
				"<p class='full-profile'>READ MORE</p>" +
				"<div class='mt-overlay'></div></div></a>";
								
			// Modal section
			output = output + 
				"<div class='modal fade' id='" + productTarget + "' role='dialog'><div class='modal-dialog modal-lg'>" +
				"<div class='modal-content' style='font-size: 20px;'><div class='modal-header'>" +
				tipimg + 
				"</div><div class='modal-body'>" +
				"<div class='tipContainer'><div class='tipFirst'><p style='color:#EE6352; font-size:200%;'><b>" + d.Name + "</b></p></div>"  +
				"<p>" +
				location +
				site + //contact +
				"<p style='margin: 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 3px; padding-left: 10px; margin-top:30px; margin-bottom:30px; font-size:150%; font-weight:bold; color:#B36500;'>" + d.ProductName + "</p>" +

				// productName +
				description +
				productType +
				disruption +
				stage +
				funding +
				costShare +
				awardDate +
				"</div>" + // Tipcontainer
				"</div><div class='modal-footer'><button type='button' class='btn btn-default' data-dismiss='modal'>Close</button></div></div></div></div>" +
				"\n\n";
		});
	});
	output = output + "</div>";

	$('#gallery-content').html(output);
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function initializeSelectionList(listItems, dropDownId, defaultValue) {
    var menuList = listItems.map(function(item) {
        return {"id": item.id, "type": item.type, "name": item.name};
    });
    menuList.unshift({"id": 0, "type": defaultValue, "name": defaultValue});

    d3.select(dropDownId)
        .append("select")
        .attr("id", function() {
            return dropDownId.substring(1) + "-select"
        })
        .attr("class", "dropdown_portfolio")
        .selectAll("option")
        .data(menuList)
        .enter()
        .append("option")
        .attr("value", function(item) {
            return item.type
        })
        .attr("class", "dropdown_portfolio")
        .text(function(item) {
            return item.name;
        });

    d3.select(dropDownId).on('change', function() {
        var id = d3.select(this).select("select").attr("id");
        var value = d3.select(this).select("select").property("value");

        d3.selectAll(".gallery-drop-down")
            .each(function () {
                var selectionId = d3.select(this).select("select").attr("id");
                if (selectionId !== id) {
                    d3.select("#" + selectionId).property("selectedIndex", 0);
                } else {
                    updateGalleryUpgraded(value);
                }
            });
    });
}


/*
 * function name: calcActiveProduct
 * parameter: productList. it is list of products from productList.csv
 * return: productList updated value of "Active" field.
 * date: Feb 12th 2020
*/
function calcActiveProduct(productList) {
    const today = new Date();
    const todayNumber = (today.getFullYear() * 100 + today.getMonth() + 1) * 100 + today.getDate();   // 02/12/2020 => 20200212
		if (productList.length != 0) {
			// productList.forEach(product => {
	for (let index = 0; index < productList.length; index++) {      // 03-03
		const product = productList[index];
					const awardEndDate = getDateNumber(product.AwardEndDate);  //02/12/20 => 20200212
					if (todayNumber <= awardEndDate) {
							product.Active = "Y";
					} else {
							product.Active = "N";
					}
	}
	}
	return productList;
}

/*
 * function name: calcActiveInActiveProduct
 * parameter: productList. it is list of products from productList.csv
 * return: productList updated value of "Active" field.
 * date: Feb 13th 2020
*/
function calcActiveProduct(productList) {
	const today = new Date();
	const todayNumber = (today.getFullYear() * 100 + today.getMonth() + 1) * 100 + today.getDate();   // 02/12/2020 => 20200212
	if (productList.length != 0) {
			// productList.forEach(product => {
		for (let index = 0; index < productList.length; index++) {      // 03-03
			const product = productList[index];
			const awardEndDate = getDateNumber(product.AwardEndDate);  //02/12/20 => 20200212
			if (todayNumber <= awardEndDate) {
					product.Active = "Y";
			} else {
					product.Active = "N";
			}
	// });
		}
	}
	return productList;
}

/*
 * function name: calcActiveInActiveProduct
 * parameter: productList. it is list of products from productList.csv
 * return: productList updated value of "Active" field.
 * date: Feb 13th 2020
*/
function calcActiveInActiveProduct(productList) {
	let products = [];
	const today = new Date();
	const todayNumber = (today.getFullYear() * 100 + today.getMonth() + 1) * 100 + today.getDate();   // 02/12/2020 => 20200212
	if (productList.length != 0) {
			let activeProducts = [];
			let inactiveProducts = [];
			// productList.forEach(product => {
	for (let index = 0; index < productList.length; index++) {    // 03-03
		const product = productList[index];
					const awardEndDate = getDateNumber(product.AwardEndDate);  //02/12/20 => 20200212
					if (todayNumber <= awardEndDate) {
							product.Active = "Y";
							activeProducts.push(product);
					} else {
							inactiveProducts.push(product);
							product.Active = "N";
					}
	// });
	}
			num_active_products = activeProducts.length;
			num_inactive_products = inactiveProducts.length;
			products.push(activeProducts);
			products.push(inactiveProducts);
	}
	return products;
}

function updatedCalcActiveInActiveProduct(productList) {
    const today = new Date();
    const todayNumber = (today.getFullYear() * 100 + today.getMonth() + 1) * 100 + today.getDate();   // 02/12/2020 => 20200212
    if (productList.length != 0) {
        productList.forEach(product => {
            const awardEndDate = getDateNumber(product.AwardEndDate);  //02/12/20 => 20200212
            if (todayNumber <= awardEndDate) {
                product.Active = "Y";
            } else {
                product.Active = "N";
            }
        });
    }
    return productList;
}

/*
 * function name: getDateNumber
 * parameter: date
 * return: number converted from date. exp: 02/12/20 => 20200212
 * date: Feb 13th 2020
*/
function getDateNumber(date) {
	let temp = date.split("/");
	return (Number("20" + temp[2]) * 100 + Number(temp[0])) * 100 + Number(temp[1]);
}

function renderGalleryFilters(productActive) {   // updated at Feb 11th 2020
	initializeSelectionList(productActive, "#zoomdrop-product-drop-down", "Select Product Active/Inactive");   // added at Feb 11th 2020
	$('#zoomdrop-product-drop-down').addClass('new-button');
}

/*
 * function name: renderMenuFilter 
 * parameter: productType, impactArea, techLevel, countries: filter values
 * description: To make filter sub menu from filter values.
 * return null
 * date Nov 26th 2020
 */
function renderMenuFilter(productType, impactArea, techLevel, countries) {
	makeMenuFilter('menudrop-product-type-drop-down', productType);
	makeMenuFilter('menudrop-impact-area-drop-down', impactArea);
	makeMenuFilter('menudrop-technology-level-drop-down', techLevel);
	makeMenuFilter('menudrop-country-level-drop-down', countries);
}

/*
 * function name: renderMenuFilter 
 * parameter: id, listItems
 * description: To make one sub menu from filter value and type.
 * return null
 * date Nov 26th 2020
 */
function makeMenuFilter(listItems, id) {
	var htmlcode = `<div class="sub-menu"><ul class="submenu-list dropdown-menu dropdown-menu-default">`;
	listItems.map(function(item) {
		htmlcode += `
			<li class="menu-item">
				<a href="javascript:;" class="${item.type}" onclick="updateGalleryUpgraded('${item.type}', '${item.name}')">
				${item.name}
				</a>
			</li>
			<li class="divider"></li>
		`;
	});
	htmlcode += `</ul></div>`;
	$('#' + id).append(htmlcode);
}

// upgrade 02-13-2020
function updateGalleryUpgraded(targetFilter, name) {
	// init
	$("#impact-area").html("IMPACT AREA");
	$("#product-type").html("PRODUCT TYPE");
	$("#tech-level").html("TECHNOLOGY LEVEL");
	$("#country").html("COUNTRY");
	// set title
	$("." + targetFilter).parent("li.menu-item").parent("ul.submenu-list").parent("div.sub-menu").parent("li").children("div.menu-title").children("a").html(name);
	if (targetFilter.indexOf("Select ") === 0) {
        showAllGalleryMembers();
        $(".seperate").show();
	} else {
		selectedType = targetFilter;
		console.log("selecte type => ", selectedType);
        let num_active_hidden = 0;
        let num_inactive_hidden = 0;
		$('.container').find('.productbox').each(function (index, element) {
			if ($(element).hasClass(targetFilter)) {
				$(element).show();
			} else {
                $(element).hide();
                if ($(element).hasClass("product-active-Y")) num_active_hidden++;
                if ($(element).hasClass("product-active-N")) num_inactive_hidden++;
            }
        });        
        if (targetFilter.indexOf("product-active") !== 0) {
            $(".type.productbox").show();
            $(".seperate").show();
        } else {
            $(".seperate").hide();
        }
        if (num_active_hidden == (num_active_products + 1)) {
            $(".type.productbox.product-active-Y").hide();
            $(".seperate").hide();
        }
        if (num_inactive_hidden == (num_inactive_products + 1)) {
            $(".type.productbox.product-active-N").hide();
            $(".seperate").hide();
        }
	}
}

function showAllGalleryMembers() {
	d3.selectAll(".gallery-drop-down")
		.each(function() {
			var selectionId = d3.select(this).select("select").attr("id");
			d3.select("#" + selectionId).property("selectedIndex", 0);
		});

	d3.selectAll(".container")
		.selectAll(".productbox")
		.style("display", "block");
}

function showProductsByStatus(status) {
	$(".productbox" + (selectedType != "" ? "." + selectedType : "")).show();
	if (status == "Active") {
		$(".productbox.inactive-gray" + (selectedType != "" ? "." + selectedType : "")).hide();
	} 
	if (status == "InActive") {
		$(".productbox.active-product" + (selectedType != "" ? "." + selectedType : "")).hide();
	}
}

/*
 * function name: getDateNumber
 * parameter: date
 * return: number converted from date. exp: 02/12/20 => 20200212
 * date: Feb 13th 2020
*/
function getDateNumber(date) {
    let temp = date.split("/");
    if (temp[2].length == 2)
        return (Number("20" + temp[2]) * 100 + Number(temp[0])) * 100 + Number(temp[1]);
    return (Number(temp[2]) * 100 + Number(temp[0])) * 100 + Number(temp[1]);
}