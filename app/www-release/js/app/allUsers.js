define("app/allUsers",["jquery","underscore","drop","drag","chart","global","form"],function(e,t,n,r,i,s){var o,u=new s,a=!1,f={init:function(){o=f,e(".calendar-month").addClass("inview"),o.unbind=null,o.flag=!1,o.resize(),o.animateBreakdown(),o.getDates(),o.bindEvents(),o.dragAndDropSelection()},bindEvents:function(){e(".navigation__next").unbind("click").bind("click",o.nextMonth),e(".navigation__prev").unbind("click").bind("click",o.prevMonth),e(".save").unbind("click").bind("click",o.submitHolidays),e(".date-select select").unbind("change").bind("change",o.showSwitchBtn),e(".editUser").unbind("click").bind("click",o.popup),e(".viewUser").unbind("click").bind("click",o.popup),e(".authoriseHols").unbind("click").bind("click",o.popup),e(".alert__submit--auth-hols").unbind("click").bind("click",o.saveAuth),e(".displayImage").unbind("change").on("change",function(){var t=this;if(t.files&&t.files[0]){var n=new FileReader;e(this).data("file",t.files[0]),n.onload=function(n){e(t).parent().find(".preview").attr("src",n.target.result)},n.readAsDataURL(this.files[0])}}),e(".edit-form").unbind("submit").on("submit",function(t){t.preventDefault(),e(this).ajaxSubmit({forceSync:!0,success:function(){e(".alert__cancel").trigger("click")}})}),e(".calendar-container").attr("data-admin")=="true"&&e(".inview tr").on("click",function(){e("tr.me").unbind().off().removeClass("me"),e(this).addClass("me"),o.dragAndDropSelection(),o.bindEvents()})},resize:function(){e(".calendar-container").css("height",e(".calendar-month__inner").actual("height"))},animateBreakdown:function(){e(".bar-chart").each(function(){var t=e(this).attr("data-allowed")*1,n=t-e(this).attr("data-taken")*1;e("span",this).css({width:n/t*100+"%"})})},getDates:function(){o.month=e("select.month").val()*1,o.year=e("select.year").val()*1,e(".date-concat").html(e("select.month option:selected").text()+" "+e("select.year option:selected").text())},nextMonth:function(t){if(o.flag)return!1;o.month+1>=12?(e("select.month").val(0),e("select.year").val(o.year+1)):e("select.month").val(o.month+1),o.changeDate(t),t.preventDefault()},prevMonth:function(t){if(o.flag)return!1;o.month-1<0?(e("select.month").val(11),e("select.year").val(o.year-1)):e("select.month").val(o.month-1),o.changeDate(t),t.preventDefault()},showSwitchBtn:function(){e(".date-select .switch").addClass("show").unbind("click").bind("click",o.changeDate)},changeDate:function(t){if(!o.flag){var n=o.month,r=o.year;o.getDates();if(r==o.year&&n==o.month)return!1;var i=e('.calendar-month[data-date="'+o.month+"_"+o.year+'"]');if(i.length>0){o.animateMonth(n,r,i);return}o.flag=!0,e.ajax({url:"/"+o.month+"/"+o.year,type:"GET",success:function(e,t,i){o.animateMonth(n,r,e)}})}t.preventDefault()},animateMonth:function(t,n,r){if(typeof r=="string"){e(".calendar-container").prepend(e(r).find(".calendar-container").html());var i=e(".calendar-month").eq(0)}else var i=e(r);var s=n<o.year||t<o.month?"month-moveToLeft":"month-moveToRight",u=n<o.year||t<o.month?"month-moveFromRight":"month-moveFromLeft";e(".calendar-month.inview").addClass(s),i.addClass("inview "+u).attr("data-date",o.month+"_"+o.year),window.setTimeout(function(){i.removeClass(u),e(".calendar-month.inview").not(i).removeClass("inview "+s),o.resize(),o.flag=!1},600),o.dragAndDropSelection(),o.bindEvents()},dragAndDropSelection:function(){e("body").mouseup(function(){a=!1}),e(".inview tr.me span").mousedown(function(){a=!0}).mouseup(function(){a=!1}).mousemove(function(t){t.preventDefault(),t.stopPropagation();var n=this;if(!a||e(this).parents("td").hasClass("weekend")||e(this).hasClass("hol-pend")||e(this).hasClass("hol-app")||n.flag)return!1;n.flag=!0,e(this).hasClass("selected")?e(this).removeClass("selected"):e(this).addClass("selected"),e(this).mouseout(function(){n.flag=!1}),e(".save").addClass("show"),e("tr.me span.selected").length==0&&e(".save").removeClass("show")}).click(function(t){e(this).toggleClass("selected"),e(".save").addClass("show"),e("tr.me span.selected").length==0&&e(".save").removeClass("show")})},submitHolidays:function(t){t.preventDefault(),o.getDates();var n=[],r=0;e(".calendar-month").each(function(){var t=e(this).attr("data-date").split("_"),i=e(this).find("tr.me"),s=1;while(s<=e(i).find("td").length){var o=e(i).find("td").eq(s),u=!0,a=!0,f=e(o).find(".selected").length;if(f>0&&!e(o).hasClass("weekend")){r=f==1?r+.5:r+1;var l=new Date(t[1],t[0],s),u=e(o).find("span").eq(0).hasClass("selected"),a=e(o).find("span").eq(1).hasClass("selected");n.push({date:l,am:u,pm:a,dateBooked:new Date,status:"pending"})}s++}}),o.confirmHolidays(r,n,o.postHolidays)},confirmHolidays:function(t,n,r){e.ajax({url:"/confirmHolidays",type:"POST",data:{dates:n},success:function(i,s,u){e(".container__inner").append(e(i)),o.alertPosition(),o.userAlert(t,n,r)}})},alertPosition:function(){window.setTimeout(function(){e(".alert__inner").animate({"margin-top":(e(window).height()-e(".alert__inner").height())/2},200)},100)},userAlert:function(t,n,r){e(".date__remove").on("click",function(t){var r=e(this).parents("tr"),i=r.index(".alert__inner tr");r.remove(),n.splice(i,1),t.preventDefault()}),e(".alert__cancel").on("click",function(t){e(".alert").fadeOut("slow",function(){e(this).remove()}),e("img").each(function(){e(this).attr("src",e(this).attr("src")+"?cache="+(new Date).getTime())}),t.preventDefault()}),e(document).keyup(function(t){t.keyCode==27&&e(".alert").fadeOut("slow",function(){e(this).remove()})}),e(".alert__submit").on("click",function(e){r(t,n),e.preventDefault()})},postHolidays:function(t,n){var r=e("tr.me").attr("data-id");e.ajax({url:"user/"+r+"/saveHolidays",type:"POST",data:{count:t,dates:n},success:function(e,t,n){u.navigate(e,"/")}})},popup:function(t){var n=e(this).attr("href");e.ajax({url:n,type:"GET",success:function(t,n,r){e(".container__inner").append(e(t)),o.bindEvents(),o.userAlert(),o.alertPosition()}}),t.preventDefault()},saveAuth:function(t){var n=[];e(".auth-hols tr").each(function(t,r){n[t]=e(this).find("select").val()}),e.ajax({url:e(".auth-hols").attr("data-url"),type:"POST",data:{auths:n},success:function(e,t,n){u.navigate(e,"/")}}),t.preventDefault()}};e(f.init)});