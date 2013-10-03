<p>
	<% if Persons.Count > 3 %>
		Group project
	<% else %>
		<ul>
			<% loop Persons %>
				<li><% if not IsExternal %><a href="/about/{$UrlSlug}/"><% end_if %>$FullName<% if not IsExternal %></a><% end_if %></li>
			<% end_loop %>
		</ul>
	<% end_if %>
</p>
<p>
	<% if DateRangeNice %>
		$DateRangeNice
	<% else %>
		<% if Date %>
			$Date.Year
		<% end_if %>
	<% end_if %>
</p>
<p><% if Space %>$Space<% if Location %>, <% end_if %><% end_if %><% if Location %>$Location<% end_if %></p>