<p>
	<% if Persons.Count > 3 %>
		Group project
	<% else %>
		<ul>
			<% loop Persons %>
				<li itemprop="author" itemscope itemtype="http://schema.org/Person">
					<% if not IsExternal %><a itemprop="url" href="/about/{$UrlSlug}/"><% end_if %><span itemprop="name">$FullName</span><% if not IsExternal %></a><% end_if %>
				</li>
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